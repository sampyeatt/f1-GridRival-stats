import {describe, expect, it} from 'vitest'
import {
    CHECKPOINTS,
    dueCheckFor,
    dueRounds,
    RACE_DURATION_MS,
    ROLLING_INTERVAL_MS,
    RoundState
} from '../src/services/checkpoints'

const MINUTE = 60_000
const HOUR = 60 * MINUTE

const RACE_START = new Date('2026-03-08T15:00:00Z')
const at = (offsetMs: number) => new Date(RACE_START.getTime() + offsetMs)

const state = (over: Partial<RoundState> = {}): RoundState => ({
    round: 1,
    startsAt: RACE_START,
    lastIngestedAt: null,
    provisional: true,
    nextRoundStartsAt: null,
    ...over
})

describe('nothing is due before the race has finished', () => {

    it('is not due before the race starts', () => {
        expect(dueCheckFor(state(), at(-2 * HOUR))).toBeNull()
    })

    it('is not due mid-race', () => {
        expect(dueCheckFor(state(), at(1 * HOUR))).toBeNull()
    })

    it('is not due in the half hour after the flag', () => {
        expect(dueCheckFor(state(), at(RACE_DURATION_MS + 20 * MINUTE))).toBeNull()
    })

    it('is never due when the schedule has no start time', () => {
        expect(dueCheckFor(state({startsAt: null}), at(100 * HOUR))).toBeNull()
    })
})

describe('the three checkpoints each fire once', () => {

    it('fires the initial ingest 30 minutes after the flag', () => {
        const check = dueCheckFor(state(), at(RACE_DURATION_MS + 31 * MINUTE))
        expect(check).toMatchObject({round: 1, trigger: 'initial', canFinalise: false})
    })

    it('does not fire again once that ingest has happened', () => {
        const justIngested = state({lastIngestedAt: at(RACE_DURATION_MS + 31 * MINUTE)})
        expect(dueCheckFor(justIngested, at(RACE_DURATION_MS + 40 * MINUTE))).toBeNull()
    })

    it('fires the 2-hour re-check', () => {
        const after = state({lastIngestedAt: at(RACE_DURATION_MS + 31 * MINUTE)})
        const check = dueCheckFor(after, at(RACE_DURATION_MS + 2 * HOUR + MINUTE))
        expect(check).toMatchObject({trigger: 'recheck-2h', canFinalise: false})
    })

    it('fires the 24-hour re-check and allows finalising', () => {
        const after = state({lastIngestedAt: at(RACE_DURATION_MS + 3 * HOUR)})
        const check = dueCheckFor(after, at(RACE_DURATION_MS + 25 * HOUR))
        expect(check).toMatchObject({trigger: 'final-24h', canFinalise: true})
    })

    it('catches up after downtime rather than missing a checkpoint', () => {
        // The process was down across every checkpoint. On restart the latest
        // one is still owed, which is why this is derived from timestamps and
        // not from armed timers — a timer would simply have been lost.
        const neverIngested = state({lastIngestedAt: null})
        const check = dueCheckFor(neverIngested, at(RACE_DURATION_MS + 30 * HOUR))
        expect(check).toMatchObject({trigger: 'final-24h', canFinalise: true})
    })
})

describe('rolling re-checks while a result is unsettled', () => {

    it('keeps looking every 6 hours after the last checkpoint', () => {
        const settledLongAgo = state({
            provisional: true,
            lastIngestedAt: at(RACE_DURATION_MS + 26 * HOUR)
        })
        expect(dueCheckFor(settledLongAgo, at(RACE_DURATION_MS + 30 * HOUR))).toBeNull()

        const check = dueCheckFor(settledLongAgo, at(RACE_DURATION_MS + 26 * HOUR + ROLLING_INTERVAL_MS))
        expect(check).toMatchObject({trigger: 'rolling', canFinalise: true})
    })

    it('stops entirely once the result is final', () => {
        const finalised = state({
            provisional: false,
            lastIngestedAt: at(RACE_DURATION_MS + 26 * HOUR)
        })
        expect(dueCheckFor(finalised, at(RACE_DURATION_MS + 200 * HOUR))).toBeNull()
    })

    it('stops chasing an old round once the next weekend has begun', () => {
        // A stale provisional round must not compete for rate limit with a live
        // one.
        const stale = state({
            provisional: true,
            lastIngestedAt: at(RACE_DURATION_MS + 26 * HOUR),
            nextRoundStartsAt: at(7 * 24 * HOUR)
        })
        expect(dueCheckFor(stale, at(6 * 24 * HOUR))).toMatchObject({trigger: 'rolling'})
        expect(dueCheckFor(stale, at(8 * 24 * HOUR))).toBeNull()
    })
})

describe('dueRounds', () => {

    it('returns only the rounds that need looking at, in round order', () => {
        const now = at(RACE_DURATION_MS + 31 * MINUTE)
        const states: RoundState[] = [
            // Finalised weeks ago.
            state({round: 1, startsAt: new Date('2026-02-01T15:00:00Z'), provisional: false,
                   lastIngestedAt: new Date('2026-02-02T15:00:00Z')}),
            // This weekend, just finished.
            state({round: 3, startsAt: RACE_START, lastIngestedAt: null}),
            // Two weeks out.
            state({round: 4, startsAt: new Date('2026-03-22T15:00:00Z'), lastIngestedAt: null})
        ]

        expect(dueRounds(states, now).map(d => d.round)).toEqual([3])
    })

    it('is empty on a quiet week', () => {
        const states = [state({provisional: false, lastIngestedAt: at(RACE_DURATION_MS + 26 * HOUR)})]
        expect(dueRounds(states, at(100 * HOUR))).toEqual([])
    })
})

describe('checkpoint configuration', () => {
    it('is ordered and starts after the race can have finished', () => {
        const offsets = CHECKPOINTS.map(c => c.afterStartMs)
        expect(offsets).toEqual([...offsets].sort((a, b) => a - b))
        expect(offsets[0]).toBeGreaterThan(RACE_DURATION_MS)
    })
})
