import {TeamResults} from '../models/TeamResults'
import _ from 'lodash'
import {BaseSalaryTeam, QualiPointsTeam, RacePointsTeam} from '../shared/constants'
import {getResutlsByRound} from './results.service'
import {getRaceByRound} from './race.services'
import {MAX_TEAM_SALARY_MOVE, nextSalary, pointsFor, salaryBracket} from './scoring'

const SALARY_ENTRIES = Object.values(BaseSalaryTeam).map(Number)

export async function getTeamResults(seasonId: number) {
    return await TeamResults.findAll({
        where: {seasonId},
        order: [['cost', 'DESC']],
        include: ['team']
    })
}

export async function getTeamResultsByRound(seasonId: number, round: number) {
    return await TeamResults.findAll({
        where: {seasonId, round},
        order: [['cost', 'DESC']]
    })
}

async function previousCostByTeam(seasonId: number, round: number): Promise<Map<string, number>> {
    if (round <= 1) return new Map()
    const rows = await TeamResults.findAll({
        attributes: ['teamId', 'cost'],
        where: {seasonId, round: round - 1}
    })
    return new Map(rows.map(r => [r.get('teamId') as string, r.get('cost') as number]))
}

/**
 * Derives constructor results for a round by aggregating the driver results
 * already scored for it.
 *
 * Shares salaryBracket and nextSalary with the driver service rather than
 * keeping the verbatim copies it had before — both copies carried the same
 * bracket defect (L4) and the same missing salary seed (L5).
 */
export async function scoreTeamRound(seasonId: number, round: number) {
    const race = await getRaceByRound(seasonId, round)
    if (!race) return {message: 'Race not found'}

    const driverResults = (await getResutlsByRound(seasonId, round)).map(r => r.toJSON())
    if (driverResults.length === 0) return {message: 'No driver results for this round'}

    const previousCosts = await previousCostByTeam(seasonId, round)
    const byTeam = _.groupBy(driverResults, 'teamId')

    const scored = Object.entries(byTeam).map(([teamId, rows]) => {
        const points = _.sumBy(rows, row => {
            // A retirement still classifies; a disqualification or non-start
            // does not. Matches the driver-side treatment.
            const raceVoid = row.raceStatus === 'dsq' || row.raceStatus === 'dns'
            const racePoint = raceVoid ? 0 : pointsFor(RacePointsTeam, row.racePosition)
            const qualiPoint = row.qualiStatus !== 'classified'
                ? 0
                : pointsFor(QualiPointsTeam, row.qualiPosition)
            return racePoint + qualiPoint
        })
        return {seasonId, round, teamId, points}
    })

    const ranked = _.orderBy(scored, ['points'], ['desc']).map((row, index) => {
        const rank = index + 1
        const target = BaseSalaryTeam[String(rank) as keyof typeof BaseSalaryTeam]
            ?? SALARY_ENTRIES[SALARY_ENTRIES.length - 1]!
        const previousCost = previousCosts.get(row.teamId) ?? null
        const {cost, positionDifference} = nextSalary(previousCost, target, MAX_TEAM_SALARY_MOVE)

        return {
            ...row,
            rank,
            cost,
            positionDifference,
            positionsForMoney: salaryBracket(cost, SALARY_ENTRIES)
        }
    })

    const final = _.orderBy(ranked, ['cost'], ['desc'])
        .map((row, index) => ({...row, easeToGainPoints: index + 1 - row.positionsForMoney}))

    for (const row of final) {
        await TeamResults.upsert({...row, provisional: true, ingestedAt: new Date()} as any)
    }

    return {round, scored: final.length}
}
