import {describe, expect, it} from 'vitest'
import {adaptWeekend, raceDistance} from '../src/shared/jolpica.adapter'
import {
    MAX_DRIVER_SALARY_MOVE,
    RoundRow,
    ScoredRow,
    scoreRoundRows
} from '../src/services/scoring'
import {BaseSalaryDriver} from '../src/shared/constants'
import {classification} from './helpers/fixtures'

/**
 * Scores three real weekends in sequence through the same pipeline the database
 * path uses, carrying history and salaries forward exactly as scoreRound does.
 *
 * This is the check that the unit tests cannot make: that a whole round of real
 * data produces sane, finite, ranked output — and specifically that round 1 is
 * no longer blank.
 */

const SALARY_ENTRIES = Object.values(BaseSalaryDriver).map(Number)

const WEEKENDS = [
    {name: 'bahrain-normal' as const, round: 1},
    {name: 'china-sprint' as const, round: 5},
    {name: 'brazil-chaos' as const, round: 21}
]

function rowsFor(name: typeof WEEKENDS[number]['name']): {rows: RoundRow[]; totalLaps: number} {
    const raceRows = classification(name, 'results')
    const entries = adaptWeekend(
        raceRows,
        classification(name, 'qualifying'),
        classification(name, 'sprint')
    )
    return {
        rows: entries.map(e => ({
            driverId: e.driverId,
            teamId: e.teamId,
            qualiPosition: e.qualiPosition,
            racePosition: e.racePosition,
            sprintPosition: e.sprintPosition,
            lapsCompleted: e.lapsCompleted,
            raceStatus: e.raceStatus,
            qualiStatus: e.qualiStatus
        })),
        totalLaps: raceDistance(raceRows)
    }
}

/** Runs the weekends in order, carrying history and cost forward. */
function runSeason(): ScoredRow[][] {
    const previousFinishes = new Map<string, number[]>()
    let previousCosts = new Map<string, number>()
    const out: ScoredRow[][] = []

    for (const weekend of WEEKENDS) {
        const {rows, totalLaps} = rowsFor(weekend.name)
        const scored = scoreRoundRows(rows, {
            totalLaps,
            previousFinishes: new Map(previousFinishes),
            previousCosts,
            salaryEntries: SALARY_ENTRIES,
            maxSalaryMove: MAX_DRIVER_SALARY_MOVE
        })
        out.push(scored)

        for (const row of scored) {
            previousFinishes.set(row.driverId, [
                ...(previousFinishes.get(row.driverId) ?? []),
                row.racePosition
            ])
        }
        previousCosts = new Map(scored.map(r => [r.driverId, r.cost]))
    }
    return out
}

describe('scoring a real season', () => {
    const [roundOne, roundTwo, roundThree] = runSeason()

    it('L1: round 1 scores real points for every driver', () => {
        // The headline regression. Previously every driver scored 0 in the
        // opener, and that zero then fed round 2's rolling average.
        expect(roundOne!).toHaveLength(20)
        expect(roundOne!.every(r => r.points > 0)).toBe(true)

        const winner = roundOne!.find(r => r.racePosition === 1)!
        expect(winner.points).toBeGreaterThan(100)
    })

    it('L5: round 1 salaries are seeded from the base table, not from zero', () => {
        const costs = roundOne!.map(r => r.cost)
        expect(Math.max(...costs)).toBe(33.0)   // top of BaseSalaryDriver
        expect(Math.min(...costs)).toBe(0.7)    // bottom of it
        expect(costs.every(c => c > 0)).toBe(true)
    })

    it('L4: no driver ever lands in bracket 0', () => {
        for (const round of [roundOne!, roundTwo!, roundThree!]) {
            for (const row of round) {
                expect(row.positionsForMoney).toBeGreaterThan(0)
                expect(row.positionsForMoney).toBeLessThanOrEqual(SALARY_ENTRIES.length)
            }
        }
    })

    it('ranks are a dense 1..n with no gaps or ties', () => {
        for (const round of [roundOne!, roundTwo!, roundThree!]) {
            const ranks = round.map(r => r.rank).sort((a, b) => a - b)
            expect(ranks).toEqual(Array.from({length: round.length}, (_, i) => i + 1))
        }
    })

    it('every total is a finite non-negative number', () => {
        for (const round of [roundOne!, roundTwo!, roundThree!]) {
            for (const row of round) {
                expect(Number.isFinite(row.points)).toBe(true)
                expect(row.points).toBeGreaterThanOrEqual(0)
                expect(Number.isFinite(row.cost)).toBe(true)
            }
        }
    })

    it('salaries move by at most the cap between rounds', () => {
        const byDriver = new Map(roundOne!.map(r => [r.driverId, r.cost]))
        for (const row of roundTwo!) {
            const before = byDriver.get(row.driverId)
            if (before === undefined) continue
            expect(Math.abs(row.cost - before)).toBeLessThanOrEqual(MAX_DRIVER_SALARY_MOVE + 1e-9)
        }
    })

    it('awards sprint points only on the sprint weekend', () => {
        expect(roundOne!.every(r => r.breakdown.sprint === 0)).toBe(true)
        expect(roundTwo!.some(r => r.breakdown.sprint > 0)).toBe(true)
    })

    it('L7: the disqualified driver at Brazil loses race points but keeps qualifying', () => {
        const dsq = roundThree!.find(r => r.raceStatus === 'dsq')!
        expect(dsq).toBeDefined()
        expect(dsq.breakdown.race).toBe(0)
        expect(dsq.breakdown.overtake).toBe(0)
        expect(dsq.breakdown.completion).toBe(0)
        expect(dsq.breakdown.improvement).toBe(0)
        expect(dsq.breakdown.qualifying).toBeGreaterThan(0)
    })

    it('retirements still score race and completion points', () => {
        const dnfs = roundThree!.filter(r => r.raceStatus === 'dnf')
        expect(dnfs.length).toBe(2)
        // A retirement is not a disqualification — they are classified.
        expect(dnfs.every(r => r.breakdown.race > 0)).toBe(true)
    })

    it('withdrawn drivers score nothing from the race', () => {
        const withdrawn = roundThree!.filter(r => r.raceStatus === 'dns')
        expect(withdrawn.length).toBe(2)
        for (const row of withdrawn) {
            expect(row.breakdown.race).toBe(0)
            expect(row.breakdown.completion).toBe(0)
        }
    })

    it('the improvement bonus rewards beating the running average', () => {
        // By round 21 every driver has a full window of history.
        const improved = roundThree!.filter(r => r.breakdown.improvement > 0)
        expect(improved.length).toBeGreaterThan(0)
        for (const row of improved) {
            expect(row.racePosition).toBeLessThan(row.breakdown.rollingAverage)
        }
    })
})
