import _ from 'lodash'
import {QualiStatus, RaceStatus} from '../shared/jolpica.adapter'
import {
    BeatingTeammatePoints,
    ImprovedPoints,
    QualiPointsDriver,
    RacePointsDriver,
    SprintPointsDriver
} from '../shared/constants'

/**
 * The GridRival scoring rules, as pure functions.
 *
 * Deliberately free of database access: every input is passed in. The previous
 * version reached into Sequelize from the middle of the points calculation,
 * which is why none of it had tests and why several of the defects below
 * survived a full season.
 *
 * The point tables in shared/constants.ts are treated as configuration and are
 * not touched here — they encode a particular league's settings.
 */

export const ROLLING_WINDOW = 8

/** Salary movement caps, in millions per round. */
export const MAX_DRIVER_SALARY_MOVE = 2
export const MAX_TEAM_SALARY_MOVE = 3

/**
 * Looks a position up in a points table, returning 0 for anything outside it.
 *
 * Previously every lookup was a bare index and a miss produced `undefined`,
 * which `_.sum` silently skips — so an out-of-range position scored zero by
 * accident rather than by decision. The behaviour is unchanged; only the
 * intent is now explicit.
 */
export function pointsFor(table: Record<string, number>, key: number | string | null): number {
    return table[String(key)] ?? 0
}

/**
 * Mean finishing position over the trailing window, rounded up.
 *
 * Two fixes over the original:
 *
 *  - It always divided by 8 regardless of how many results existed, so early
 *    in a season the average was diluted toward the front of the grid and
 *    inflated the improvement bonus (L6).
 *  - With fewer than 8 results it padded the window with the driver's earliest
 *    result, but dropped that result from the sum while padding — leaving 7
 *    entries' worth of data over a divisor of 8 (an off-by-one inside L1).
 *
 * `previous` must be in round order. `fallback` is used when there is no
 * history at all: passing the driver's own race position makes the improvement
 * delta zero, which is the neutral outcome for round 1.
 */
export function rollingAverage(previous: number[], fallback: number, window = ROLLING_WINDOW): number {
    if (previous.length === 0) return fallback

    const earliest = previous[0]!
    const padding = Math.max(0, window - previous.length)
    const padded = [...previous, ...Array(padding).fill(earliest)]

    return Math.ceil(_.sum(padded) / padded.length)
}

/** Completion points accrue at the 25%, 50%, 75% and 90% marks. */
export function completionPoints(percentageOfRace: number): number {
    if (percentageOfRace < 25) return 0
    if (percentageOfRace < 50) return 3
    if (percentageOfRace < 75) return 6
    if (percentageOfRace < 90) return 9
    return 12
}

/**
 * Which salary bracket a cost falls into, 1 (most expensive) upward.
 *
 * `entries` is the base-salary table in descending order. The bracket is the
 * last entry the salary still reaches.
 *
 * The original read `salary <= entries[i] && salary > entries[i + 1]`, so at
 * the final index `entries[i + 1]` was `undefined`, `salary > undefined` was
 * false, and any salary at or below the cheapest bracket fell through to
 * `findIndex` returning -1 — i.e. bracket 0, which is not a bracket (L4). A
 * salary above the top of the table did the same.
 */
export function salaryBracket(salary: number, entries: number[]): number {
    let last = -1
    for (let i = 0; i < entries.length; i++) {
        if (entries[i]! >= salary) last = i
    }
    // Above the most expensive bracket clamps to 1; at or below the cheapest
    // clamps to the last bracket. Neither can produce 0.
    return last === -1 ? 1 : last + 1
}

/**
 * Where a salary moves to for the next round.
 *
 * It drifts toward the base salary for the rank just achieved, by at most
 * `maxMove` per round.
 *
 * When there is no previous round the salary is *seeded* at the target rather
 * than starting from zero (L5). The original returned `{totalSalary: 0}`, so
 * the entire cost ladder began at 0 and crept upward by at most 2.0 a round —
 * and 0 then fell through the bracket lookup, giving every round-1 driver
 * `positionsForMoney: 0`.
 */
export function nextSalary(
    previousCost: number | null,
    targetSalary: number,
    maxMove: number
): {cost: number; positionDifference: number} {
    if (previousCost === null) {
        return {cost: _.round(targetSalary, 1), positionDifference: 0}
    }

    const differ = _.round(targetSalary - previousCost, 1)
    const magnitude = _.floor(Math.abs(differ) / 4, 1)
    const positionDifference = _.clamp(Math.sign(differ) * magnitude, -maxMove, maxMove)

    return {
        cost: _.round(previousCost + positionDifference, 1),
        positionDifference
    }
}

export interface DriverScoreInput {
    qualiPosition: number
    racePosition: number
    sprintPosition: number | null
    teammatePosition: number
    lapsCompleted: number
    totalLaps: number
    raceStatus: RaceStatus
    qualiStatus: QualiStatus
    /** Finishing positions from the trailing window, in round order. */
    previousFinishes: number[]
}

export interface DriverScoreBreakdown {
    qualifying: number
    race: number
    sprint: number
    overtake: number
    teammate: number
    completion: number
    improvement: number
    total: number
    rollingAverage: number
}

/**
 * Scores one driver's weekend, returning the component breakdown as well as the
 * total. The breakdown replaces the blocks of commented-out console.log that
 * used to sit in this calculation (L12) and makes each component assertable.
 */
export function scoreDriver(input: DriverScoreInput): DriverScoreBreakdown {
    const {
        qualiPosition, racePosition, sprintPosition, teammatePosition,
        lapsCompleted, totalLaps, raceStatus, qualiStatus, previousFinishes
    } = input

    // A disqualification or a non-start voids the race-derived components; a
    // retirement does not, since the driver still completed part of the race.
    const raceVoid = raceStatus === 'dsq' || raceStatus === 'dns'
    const qualiVoid = qualiStatus !== 'classified'

    const average = rollingAverage(previousFinishes, racePosition)

    const qualifying = qualiVoid ? 0 : pointsFor(QualiPointsDriver, qualiPosition)
    const race = raceVoid ? 0 : pointsFor(RacePointsDriver, racePosition)
    const sprint = pointsFor(SprintPointsDriver, sprintPosition)

    const overtake = raceVoid ? 0 : Math.max(qualiPosition - racePosition, 0) * 3
    const teammate = raceVoid
        ? 0
        : pointsFor(BeatingTeammatePoints, Math.max(teammatePosition - racePosition, 0))
    const completion = raceVoid
        ? 0
        : completionPoints(totalLaps > 0 ? (lapsCompleted / totalLaps) * 100 : 0)

    // Improvement is purely a race-outcome bonus — it compares this race finish
    // to the average race finish — so it is voided by the race status alone.
    // The original guard was `(!raceVoid || !qualiVoid)`, an OR that awarded the
    // bonus unless the driver was disqualified from *both* sessions (L7).
    const improvement = raceVoid
        ? 0
        : pointsFor(ImprovedPoints, Math.round(average - racePosition))

    return {
        qualifying,
        race,
        sprint,
        overtake,
        teammate,
        completion,
        improvement,
        rollingAverage: average,
        total: qualifying + race + sprint + overtake + teammate + completion + improvement
    }
}

export interface RoundRow {
    driverId: string
    teamId: string
    qualiPosition: number
    racePosition: number
    sprintPosition: number | null
    lapsCompleted: number
    raceStatus: RaceStatus
    qualiStatus: QualiStatus
}

export interface RoundContext {
    totalLaps: number
    /** Trailing finishes per driver, in round order. */
    previousFinishes: Map<string, number[]>
    /** Previous round's cost per driver; absent means there was no previous round. */
    previousCosts: Map<string, number>
    /** Base salary table, descending. */
    salaryEntries: number[]
    maxSalaryMove: number
}

export interface ScoredRow extends RoundRow {
    points: number
    rank: number
    cost: number
    positionDifference: number
    positionsForMoney: number
    easeToGainPoints: number
    breakdown: DriverScoreBreakdown
}

/**
 * The whole per-round pipeline: points, then rank, then salary, then the two
 * dashboard indices.
 *
 * Pure, so the database path and the tests run the same code rather than a
 * reimplementation of it.
 */
export function scoreRoundRows(rows: RoundRow[], ctx: RoundContext): ScoredRow[] {
    const teammateOf = (driverId: string, teamId: string) =>
        rows.find(r => r.teamId === teamId && r.driverId !== driverId)

    const scored = rows.map(row => {
        const teammate = teammateOf(row.driverId, row.teamId)
        const breakdown = scoreDriver({
            qualiPosition: row.qualiPosition,
            racePosition: row.racePosition,
            sprintPosition: row.sprintPosition,
            teammatePosition: teammate?.racePosition ?? row.racePosition,
            lapsCompleted: row.lapsCompleted,
            totalLaps: ctx.totalLaps,
            raceStatus: row.raceStatus,
            qualiStatus: row.qualiStatus,
            previousFinishes: ctx.previousFinishes.get(row.driverId) ?? []
        })
        return {...row, breakdown, points: breakdown.total}
    })

    const ranked = _.orderBy(scored, ['points', 'racePosition'], ['desc', 'asc'])
        .map((row, index) => {
            const rank = index + 1
            // Ranks beyond the salary table fall to its cheapest entry.
            const target = ctx.salaryEntries[Math.min(rank, ctx.salaryEntries.length) - 1]!
            const previousCost = ctx.previousCosts.get(row.driverId) ?? null
            const {cost, positionDifference} = nextSalary(previousCost, target, ctx.maxSalaryMove)

            return {
                ...row,
                rank,
                cost,
                positionDifference,
                positionsForMoney: salaryBracket(cost, ctx.salaryEntries)
            }
        })

    return _.orderBy(ranked, ['cost'], ['desc'])
        .map((row, index) => ({...row, easeToGainPoints: index + 1 - row.positionsForMoney}))
}
