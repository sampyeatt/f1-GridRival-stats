import {TeamResults} from '../models/TeamResults'
import _ from 'lodash'
import {BaseSalaryTeam, QualiPointsTeam, RacePointsTeam} from '../shared/constants'
import {getRaceDataByMeetingKey} from './race.services'
import {getResutlsByRound} from './results.service'

export async function getTeamResults(seasonId: number) {
    return await TeamResults.findAll({
        where: {
            seasonId: seasonId
        },
        order: [['cost', 'DESC']],
        include: ['team']
    })
}


export async function getTeamResultsByRound(seasonId: number, round: number) {
    return await TeamResults.findAll({
        where: {
            seasonId: seasonId,
            round: round
        },
        order: [['cost', 'DESC']]
    })
}

export async function bulkAddTeamResults(results: TeamResults[]) {
    return await TeamResults.bulkCreate(results)
}

export async function getTotalSalaryAndPosDiffTeam(teamId: string, seasonId: number, round: number, teamRank: number) {
    const resultsDB = await TeamResults.findOne({
        where: {
            teamId: teamId,
            seasonId: seasonId,
            round: round - 1
        }
    })
    const results = resultsDB?.toJSON()
    if (!results) return {
        totalSalary: 0,
        positionDifference: 0
    }
    const differ = _.round(BaseSalaryTeam[String(teamRank) as keyof typeof BaseSalaryTeam] - results.cost, 1)

    const posDiff = Math.max(-3, Math.min(3, (Math.sign(differ) * _.floor((Math.sign(differ) * differ / 4), 1))))
    return {
        totalSalary: (posDiff + results.cost),
        positionDifference: posDiff
    }
}

export async function findSalaryBracketTeamResults(salary: number, entries: number[]) {

    const found = _.findIndex(entries, (val, i) => {
        const prevVal = entries[i + 1]
        return salary <= val! && salary > prevVal!
    })

    return found + 1
}

export async function teamResultsToAdd(seasonId: number, meeting_key: number) {

    const raceres = (await getRaceDataByMeetingKey(meeting_key))
    if (!raceres) return {message: 'Race DB not found'}
    const race = raceres?.toJSON()
    const round = race.round
    const raceId = race.raceId
    const results = _.map(await getResutlsByRound(+seasonId, +round), result => result.toJSON())

    if (!results) return {message: 'Race Results not found'}
    let teamResults = await Promise.all(_(results)
        .groupBy('teamId')
        .map(async (value, key: string) => {

            const points = _(value).map(driverResult => {

                const racePoint = (!driverResult.raceDNS && !driverResult.raceDSQ) ? RacePointsTeam[String(driverResult.finishPosition) as keyof typeof RacePointsTeam] : 0
                const qualiPoint = (!driverResult.qualiDSQ) ? QualiPointsTeam[String(driverResult.qualiPosition) as keyof typeof QualiPointsTeam] : 0
                if (key === 'mercedes' || key === 'red_bull') {
                    console.log('*********************************')
                    console.log('driverResult: ', driverResult)
                    console.log('racePoint: ', racePoint)
                    console.log('qualiPoint: ', qualiPoint)
                    console.log('*********************************')
                }
                return (racePoint + qualiPoint)
            }).sum()
            return {
                raceId: raceId,
                points: points,
                cost: -1,
                seasonId: seasonId,
                round: round,
                teamId: key,
                positionDifference: -1,
                positionsForMoney: -1,
                easeToGainPoints: -1,
                rank: -1,
                meeting_key: meeting_key
            }
        }).value())
    const entries = Object.entries(BaseSalaryTeam)
        .map(([key, value]) => Number(value))

    teamResults = await Promise.all(_.orderBy(teamResults, ['points'], ['desc']).map(async (value, key) => {
        value.rank = key + 1
        const {
            totalSalary,
            positionDifference
        } = await getTotalSalaryAndPosDiffTeam(value.teamId, value.seasonId, value.round, key + 1)
        value.cost = _.round(totalSalary, 1)
        value.positionDifference = positionDifference
        value.positionsForMoney = await findSalaryBracketTeamResults(value.cost, entries)
        return value
    }))
    teamResults = await Promise.all(_.orderBy(teamResults, ['cost'], ['desc']).map(async (value, key) => {
        value.easeToGainPoints = key + 1 - value.positionsForMoney!
        return value
    }))

    return teamResults
}

export function upsertTeamResultsBulk(resultData: Partial<TeamResults>) {
    console.log('resultData: ', resultData)
    const teamResultInstance = new TeamResults()
    teamResultInstance.set(resultData)
    return teamResultInstance.save()
}