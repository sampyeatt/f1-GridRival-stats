/**
 * Decides when a round is due for an ingest check.
 *
 * Pure and clock-injected so the whole schedule can be tested without waiting
 * for a race weekend.
 *
 * The shape is a weekend, not a poll: a round is only ever due in the day or so
 * after its race, and once its classification has settled it stops being due at
 * all. Between events the scheduler's tick does one indexed query and exits.
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** Regulation maximum race length; the classification lands shortly after. */
export const RACE_DURATION_MS = 2 * HOUR

export interface Checkpoint {
    name: string
    /** Offset from race start. */
    afterStartMs: number
}

/**
 * Checkpoints after the race starts. The first is the initial ingest; the two
 * after it catch stewards' decisions, which routinely land hours later and
 * which the old manual flow had no way to notice at all.
 */
export const CHECKPOINTS: Checkpoint[] = [
    {name: 'initial', afterStartMs: RACE_DURATION_MS + 30 * MINUTE},
    {name: 'recheck-2h', afterStartMs: RACE_DURATION_MS + 2 * HOUR},
    {name: 'final-24h', afterStartMs: RACE_DURATION_MS + 24 * HOUR}
]

/** While a round is still provisional, keep looking this often. */
export const ROLLING_INTERVAL_MS = 6 * HOUR

export interface RoundState {
    round: number
    /** Race start in UTC; null when the schedule has no time for it. */
    startsAt: Date | null
    /** Newest ingestedAt across the round's rows, or null if never ingested. */
    lastIngestedAt: Date | null
    /** True while the classification is not known to be final. */
    provisional: boolean
    /** Start of the next round, used to stop chasing an old result. */
    nextRoundStartsAt: Date | null
}

export interface DueCheck {
    round: number
    trigger: string
    /** True once the final checkpoint has passed and nothing has changed. */
    canFinalise: boolean
}

/**
 * Whether a round needs looking at now, and what to record as the trigger.
 *
 * A round is due when the most recent elapsed checkpoint is newer than the last
 * ingest — so a restart cannot miss a checkpoint, and a checkpoint cannot fire
 * twice. That is why this is derived from stored timestamps rather than from
 * armed timers: timers do not survive a deploy.
 */
export function dueCheckFor(state: RoundState, now: Date): DueCheck | null {
    if (!state.startsAt) return null

    // A finalised round is done with permanently. Without this, a round whose
    // last checkpoint passed while the process was down would keep coming back
    // as due for the rest of the season, even though its result had settled.
    if (!state.provisional) return null

    const elapsed = now.getTime() - state.startsAt.getTime()
    const passed = CHECKPOINTS.filter(c => elapsed >= c.afterStartMs)
    if (passed.length === 0) return null

    const latest = passed[passed.length - 1]!
    const latestTime = state.startsAt.getTime() + latest.afterStartMs
    const lastIngest = state.lastIngestedAt?.getTime() ?? null
    const finalPassed = elapsed >= CHECKPOINTS[CHECKPOINTS.length - 1]!.afterStartMs

    // Never ingested, or not since the most recent checkpoint came round.
    if (lastIngest === null || lastIngest < latestTime) {
        return {round: state.round, trigger: latest.name, canFinalise: finalPassed}
    }

    // Past every checkpoint but still unsettled: keep looking on a slow rolling
    // interval, and stop once the next race weekend has begun — by then the
    // classification is final in practice and a stale round should not compete
    // for rate limit with a live one.
    const nextHasStarted = state.nextRoundStartsAt !== null
        && now.getTime() >= state.nextRoundStartsAt.getTime()
    if (!nextHasStarted && now.getTime() - lastIngest >= ROLLING_INTERVAL_MS) {
        return {round: state.round, trigger: 'rolling', canFinalise: finalPassed}
    }

    return null
}

/** The rounds needing a look, oldest first. */
export function dueRounds(states: RoundState[], now: Date): DueCheck[] {
    return states
        .map(state => dueCheckFor(state, now))
        .filter((check): check is DueCheck => check !== null)
        .sort((a, b) => a.round - b.round)
}
