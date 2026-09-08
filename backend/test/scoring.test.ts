import {describe, expect, it} from 'vitest'
import {
    completionPoints,
    nextSalary,
    pointsFor,
    rollingAverage,
    salaryBracket,
    scoreDriver,
    DriverScoreInput,
    MAX_DRIVER_SALARY_MOVE
} from '../src/services/scoring'
import {BaseSalaryDriver, ImprovedPoints, QualiPointsDriver, RacePointsDriver} from '../src/shared/constants'

const salaryEntries = Object.values(BaseSalaryDriver).map(Number)

/** A clean midfield weekend; override per test. */
const input = (over: Partial<DriverScoreInput> = {}): DriverScoreInput => ({
    qualiPosition: 10,
    racePosition: 10,
    sprintPosition: null,
    teammatePosition: 12,
    lapsCompleted: 57,
    totalLaps: 57,
    raceStatus: 'classified',
    qualiStatus: 'classified',
    previousFinishes: [],
    ...over
})

describe('L1 — round 1 no longer scores zero', () => {

    it('scores a full weekend with no history at all', () => {
        // The original returned 0 as the TOTAL when the trailing window was
        // empty, so every driver blanked in round 1 and that zero then poisoned
        // round 2's average.
        const result = scoreDriver(input({qualiPosition: 3, racePosition: 1, previousFinishes: []}))

        expect(result.qualifying).toBe(QualiPointsDriver['3'])
        expect(result.race).toBe(RacePointsDriver['1'])
        expect(result.overtake).toBe(6)          // gained 2 places, 3 apiece
        expect(result.completion).toBe(12)       // ran the full distance
        expect(result.total).toBeGreaterThan(150)
    })

    it('awards no improvement bonus when there is no history', () => {
        // The neutral outcome: with no average to beat, the delta is zero.
        const result = scoreDriver(input({racePosition: 5, previousFinishes: []}))
        expect(result.rollingAverage).toBe(5)
        expect(result.improvement).toBe(0)
    })
})

describe('L6 — the rolling average divides by what it has', () => {

    it('averages a partial window over its real length, padded from the earliest', () => {
        // Four results early in a season: the window is padded to 8 with the
        // driver's earliest finish, which is what the original was reaching
        // for — but it dropped that result from the sum while padding with it,
        // leaving 7 entries' worth of data over a divisor of 8.
        //   [4, 6, 8, 10] → pad with 4 four more times → 4,6,8,10,4,4,4,4 = 44
        //   ceil(44 / 8) = 6
        expect(rollingAverage([4, 6, 8, 10], 99)).toBe(6)
    })

    it('does not dilute a short window toward the front of the grid', () => {
        // Two results, both last. The old divide-by-8 gave ceil(40/8) = 5,
        // i.e. "averages fifth", which handed a backmarker a large improvement
        // bonus for finishing anywhere near the points.
        expect(rollingAverage([20, 20], 99)).toBe(20)
    })

    it('uses a full window unpadded', () => {
        expect(rollingAverage([1, 2, 3, 4, 5, 6, 7, 8], 99)).toBe(5)   // ceil(36/8)
    })

    it('falls back when the window is empty', () => {
        expect(rollingAverage([], 12)).toBe(12)
    })
})

describe('L3 — table misses score zero explicitly', () => {

    it('returns 0 outside the table rather than undefined', () => {
        expect(pointsFor(RacePointsDriver, 23)).toBe(0)
        expect(pointsFor(RacePointsDriver, -3)).toBe(0)
        expect(pointsFor(RacePointsDriver, null)).toBe(0)
        expect(pointsFor(RacePointsDriver, 1)).toBe(100)
    })

    it('gives no improvement for finishing at or below the average', () => {
        // GridRival awards improvement only for finishing ABOVE the rolling
        // average, so this is the correct outcome — it was simply arriving via
        // a missing object key and _.sum skipping undefined.
        const atAverage = scoreDriver(input({racePosition: 10, previousFinishes: [10, 10, 10, 10, 10, 10, 10, 10]}))
        expect(atAverage.improvement).toBe(0)

        const belowAverage = scoreDriver(input({racePosition: 15, previousFinishes: [8, 8, 8, 8, 8, 8, 8, 8]}))
        expect(belowAverage.improvement).toBe(0)
    })

    it('does award improvement for beating the average', () => {
        // Average 10, finished 5th → 5 places better.
        const result = scoreDriver(input({racePosition: 5, previousFinishes: Array(8).fill(10)}))
        expect(result.rollingAverage).toBe(10)
        expect(result.improvement).toBe(ImprovedPoints['5'])
    })
})

describe('L4 — salary brackets never return 0', () => {

    it('keeps the mid-range behaviour unchanged', () => {
        // These matched before the fix and must still match.
        expect(salaryBracket(20, salaryEntries)).toBe(8)
        expect(salaryBracket(25, salaryEntries)).toBe(5)
        expect(salaryBracket(33.0, salaryEntries)).toBe(1)
    })

    it('clamps at or below the cheapest bracket', () => {
        // Previously 0: entries[i + 1] is undefined at the last index and
        // `salary > undefined` is always false.
        expect(salaryBracket(0.7, salaryEntries)).toBe(20)
        expect(salaryBracket(0.5, salaryEntries)).toBe(20)
        expect(salaryBracket(0, salaryEntries)).toBe(20)
    })

    it('clamps above the most expensive bracket', () => {
        expect(salaryBracket(40, salaryEntries)).toBe(1)
    })

    it('never returns 0 for any salary in range', () => {
        for (let salary = 0; salary <= 40; salary += 0.1) {
            expect(salaryBracket(_round(salary), salaryEntries)).toBeGreaterThan(0)
        }
    })
})

describe('L5 — salaries start at their base, not at zero', () => {

    it('seeds the first round from the base salary for that rank', () => {
        // The original returned 0 here, so the whole ladder began at zero and
        // could only climb 2.0 per round.
        expect(nextSalary(null, BaseSalaryDriver['1'], MAX_DRIVER_SALARY_MOVE))
            .toEqual({cost: 33.0, positionDifference: 0})
        expect(nextSalary(null, BaseSalaryDriver['20'], MAX_DRIVER_SALARY_MOVE))
            .toEqual({cost: 0.7, positionDifference: 0})
    })

    it('drifts toward the target by at most the cap', () => {
        // 10.0 → target 33.0 is a 23.0 gap; a quarter of that is capped at 2.0.
        const up = nextSalary(10.0, 33.0, MAX_DRIVER_SALARY_MOVE)
        expect(up.positionDifference).toBe(2)
        expect(up.cost).toBe(12.0)

        const down = nextSalary(30.0, 5.0, MAX_DRIVER_SALARY_MOVE)
        expect(down.positionDifference).toBe(-2)
        expect(down.cost).toBe(28.0)
    })

    it('moves a fraction when the gap is small', () => {
        // Gap of 2.0 → a quarter is 0.5.
        const result = nextSalary(20.0, 22.0, MAX_DRIVER_SALARY_MOVE)
        expect(result.positionDifference).toBe(0.5)
        expect(result.cost).toBe(20.5)
    })

    it('does not move when the salary is already at target', () => {
        expect(nextSalary(20.0, 20.0, MAX_DRIVER_SALARY_MOVE))
            .toEqual({cost: 20.0, positionDifference: 0})
    })
})

describe('L7 — a race disqualification voids the race components', () => {

    it('voids race, overtake, teammate, completion and improvement on a DSQ', () => {
        const result = scoreDriver(input({
            racePosition: 1,
            qualiPosition: 1,
            raceStatus: 'dsq',
            previousFinishes: Array(8).fill(15)
        }))

        expect(result.race).toBe(0)
        expect(result.overtake).toBe(0)
        expect(result.teammate).toBe(0)
        expect(result.completion).toBe(0)
        // The original guard `(!raceVoid || !qualiVoid)` awarded improvement
        // here, because the driver was not ALSO disqualified from qualifying.
        expect(result.improvement).toBe(0)
        // Qualifying still counts — it was a clean session.
        expect(result.qualifying).toBe(QualiPointsDriver['1'])
    })

    it('keeps race points for a retirement, which is not a disqualification', () => {
        const result = scoreDriver(input({
            racePosition: 18,
            lapsCompleted: 30,
            totalLaps: 57,
            raceStatus: 'dnf'
        }))
        expect(result.race).toBe(RacePointsDriver['18'])
        expect(result.completion).toBe(6)      // 52% of the distance
    })

    it('voids qualifying points but keeps race points on a qualifying DSQ', () => {
        const result = scoreDriver(input({
            qualiStatus: 'dsq',
            qualiPosition: 1,
            racePosition: 3,
            previousFinishes: Array(8).fill(10)
        }))
        expect(result.qualifying).toBe(0)
        expect(result.race).toBe(RacePointsDriver['3'])
        // Improvement is a race-outcome bonus, so a qualifying DSQ leaves it.
        expect(result.improvement).toBe(ImprovedPoints['7'])
    })
})

describe('completion points', () => {
    it('steps at 25, 50, 75 and 90 per cent', () => {
        expect(completionPoints(0)).toBe(0)
        expect(completionPoints(24.9)).toBe(0)
        expect(completionPoints(25)).toBe(3)
        expect(completionPoints(50)).toBe(6)
        expect(completionPoints(75)).toBe(9)
        expect(completionPoints(90)).toBe(12)
        expect(completionPoints(100)).toBe(12)
    })

    it('is 0 rather than NaN when the race distance is unknown', () => {
        expect(scoreDriver(input({totalLaps: 0, lapsCompleted: 0})).completion).toBe(0)
    })
})

describe('totals are always finite numbers', () => {
    it('never produces NaN across the full position range', () => {
        for (let racePos = 1; racePos <= 22; racePos++) {
            for (const qualiPos of [1, 10, 20, 22]) {
                const result = scoreDriver(input({
                    racePosition: racePos,
                    qualiPosition: qualiPos,
                    sprintPosition: racePos,
                    previousFinishes: [racePos]
                }))
                expect(Number.isFinite(result.total)).toBe(true)
                expect(result.total).toBeGreaterThanOrEqual(0)
            }
        }
    })
})

function _round(n: number): number {
    return Math.round(n * 10) / 10
}
