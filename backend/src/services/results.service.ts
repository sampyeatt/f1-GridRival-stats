import {Results} from '../models/Results'
import _ from 'lodash'
import {Op} from 'sequelize'
import {BaseSalaryDriver} from '../shared/constants'
import {getRaceByRound} from './race.services'
import {
    DriverScoreBreakdown,
    MAX_DRIVER_SALARY_MOVE,
    ROLLING_WINDOW,
    RoundRow,
    scoreRoundRows
} from './scoring'

export async function getResutls(seasonId: number) {
    return await Results.findAll({
        where: {seasonId},
        order: [['cost', 'DESC']],
        include: ['driver']
    })
}

export async function getResutlsByRound(seasonId: number, round: number) {
    return await Results.findAll({
        where: {seasonId, round},
        order: [['cost', 'DESC']]
    })
}

export async function getResult(seasonId: number, round: number, driverId: string) {
    return await Results.findOne({where: {seasonId, round, driverId}})
}

const SALARY_ENTRIES = Object.values(BaseSalaryDriver).map(Number)

/**
 * Finishing positions from the trailing window, keyed by driver and in round
 * order.
 *
 * One query for the whole grid. The previous version issued a findAll per
 * driver from inside the points calculation, and then a findOne per driver for
 * the salary — roughly 40 queries per round instead of 2.
 */
async function previousFinishesByDriver(
    seasonId: number,
    round: number
): Promise<Map<string, number[]>> {
    const rows = await Results.findAll({
        attributes: ['driverId', 'round', 'racePosition'],
        where: {
            seasonId,
            round: {[Op.between]: [Math.max(round - ROLLING_WINDOW, 1), round - 1]}
        },
        order: [['round', 'ASC']]
    })

    const map = new Map<string, number[]>()
    for (const row of rows) {
        const driverId = row.get('driverId') as string
        const list = map.get(driverId) ?? []
        list.push(row.get('racePosition') as number)
        map.set(driverId, list)
    }
    return map
}

/** Previous round's cost per driver; absent means "no previous round". */
async function previousCostByDriver(seasonId: number, round: number): Promise<Map<string, number>> {
    if (round <= 1) return new Map()
    const rows = await Results.findAll({
        attributes: ['driverId', 'cost'],
        where: {seasonId, round: round - 1}
    })
    return new Map(rows.map(r => [r.get('driverId') as string, r.get('cost') as number]))
}

export interface ScoredRound {
    round: number
    scored: number
    breakdown: Array<{driverId: string; rank: number; points: number; cost: number} & DriverScoreBreakdown>
}

/**
 * Scores one round from the classification already stored by ingest.
 *
 * Ingest writes the facts (positions, statuses, laps); this derives points,
 * rank, cost and the two dashboard indices from them and writes those back.
 * Safe to re-run — that is what the /rescore endpoint and Phase 4's provisional
 * re-checks depend on.
 */
export async function scoreRound(seasonId: number, round: number): Promise<ScoredRound | {message: string}> {
    const race = await getRaceByRound(seasonId, round)
    if (!race) return {message: 'Race not found'}

    const totalLaps = race.get('totalLaps') as number
    const stored = (await getResutlsByRound(seasonId, round)).map(r => r.toJSON())
    if (stored.length === 0) return {message: 'No results ingested for this round'}

    const history = await previousFinishesByDriver(seasonId, round)
    const previousCosts = await previousCostByDriver(seasonId, round)

    const rows: RoundRow[] = stored.map(row => ({
        driverId: row.driverId!,
        teamId: row.teamId!,
        qualiPosition: row.qualiPosition!,
        racePosition: row.racePosition!,
        sprintPosition: row.sprintPosition ?? null,
        lapsCompleted: row.lapsCompleted!,
        raceStatus: row.raceStatus!,
        qualiStatus: row.qualiStatus!
    }))

    const final = scoreRoundRows(rows, {
        totalLaps,
        previousFinishes: history,
        previousCosts,
        salaryEntries: SALARY_ENTRIES,
        maxSalaryMove: MAX_DRIVER_SALARY_MOVE
    })

    for (const row of final) {
        await Results.update({
            points: row.points,
            rank: row.rank,
            cost: row.cost,
            positionDifference: row.positionDifference,
            positionsForMoney: row.positionsForMoney,
            easeToGainPoints: row.easeToGainPoints
        } as any, {where: {seasonId, round, driverId: row.driverId}})
    }

    return {
        round,
        scored: final.length,
        breakdown: final.map(row => ({
            driverId: row.driverId!,
            rank: row.rank,
            points: row.points,
            cost: row.cost,
            ...row.breakdown
        }))
    }
}

/**
 * Re-scores a round and every round after it.
 *
 * A changed classification does not only alter its own round: the rolling
 * average feeds the next seven, and the salary ladder is a chain from one round
 * to the next. Phase 4's provisional re-checks call this.
 */
export async function rescoreFrom(seasonId: number, fromRound: number) {
    const rounds = await Results.findAll({
        attributes: ['round'],
        where: {seasonId, round: {[Op.gte]: fromRound}},
        group: ['round'],
        order: [['round', 'ASC']]
    })

    const out = []
    for (const row of rounds) {
        out.push(await scoreRound(seasonId, row.get('round') as number))
    }
    return out
}
