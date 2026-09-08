import {Op} from 'sequelize'
import {Race} from '../models/Race'
import {Results} from '../models/Results'
import {TeamResults} from '../models/TeamResults'
import {IngestRun, IngestOutcome} from '../models/IngestRun'
import logger from '../shared/logger.util'
import {getActiveSeason} from './season.services'
import {ingestDriversAndTeams, ingestRound, ingestSchedule} from './ingest.service'
import {rescoreFrom, scoreRound} from './results.service'
import {scoreTeamRound} from './teamresults.service'
import {DueCheck, dueRounds, RoundState} from './checkpoints'

/**
 * The scheduled side of ingest.
 *
 * Everything here is driven by timestamps in the database rather than by armed
 * timers: a tick asks "what is owed?" and acts, so a restart or a deploy cannot
 * drop a checkpoint. On a quiet week the tick is one indexed query and nothing
 * else — no upstream calls at all.
 */

async function record(
    kind: string,
    seasonId: number,
    round: number | null,
    trigger: string,
    outcome: IngestOutcome,
    startedAt: number,
    detail?: string,
    classificationChanged = false
): Promise<void> {
    await IngestRun.create({
        kind,
        seasonId,
        round,
        trigger,
        outcome,
        detail: detail ?? null,
        classificationChanged,
        durationMs: Date.now() - startedAt,
        startedAt: new Date(startedAt)
    } as any)
}

/** Assembles what the checkpoint logic needs, in one pass over the season. */
export async function roundStates(seasonId: number): Promise<RoundState[]> {
    const races = await Race.findAll({where: {seasonId}, order: [['round', 'ASC']]})

    const results = await Results.findAll({
        attributes: ['round', 'ingestedAt', 'provisional'],
        where: {seasonId}
    })

    const lastIngest = new Map<number, Date>()
    const stillProvisional = new Map<number, boolean>()
    for (const row of results) {
        const round = row.get('round') as number
        const at = row.get('ingestedAt') as Date
        const current = lastIngest.get(round)
        if (!current || at > current) lastIngest.set(round, at)

        // Seeded false on the first row seen for a round, so a round whose rows
        // are all final reads as final. Defaulting to true here instead would
        // make every settled round look unsettled and put it back in the queue
        // for the rest of the season.
        stillProvisional.set(round, (stillProvisional.get(round) ?? false) || Boolean(row.get('provisional')))
    }

    return races.map((race, index) => {
        const round = race.get('round') as number
        const next = races[index + 1]
        const hasRows = lastIngest.has(round)
        return {
            round,
            startsAt: (race.get('startsAt') as Date | null) ?? null,
            lastIngestedAt: lastIngest.get(round) ?? null,
            // A round with no rows has never been ingested, so it counts as
            // unsettled and gets picked up by its first checkpoint.
            provisional: hasRows ? stillProvisional.get(round)! : true,
            nextRoundStartsAt: (next?.get('startsAt') as Date | null) ?? null
        }
    })
}

/** Marks a round's rows final, so the scheduler stops looking at it. */
async function finalise(seasonId: number, round: number): Promise<void> {
    await Results.update({provisional: false} as any, {where: {seasonId, round}})
    await TeamResults.update({provisional: false} as any, {where: {seasonId, round}})
    logger.info(`scheduler: ${seasonId} r${round} finalised`)
}

/**
 * Runs one due check.
 *
 * A changed classification re-scores this round *and every round after it* —
 * the rolling average feeds the next seven and the salary ladder chains
 * forward, so scoring the corrected round alone would leave the rest stale.
 */
export async function runCheck(seasonId: number, check: DueCheck): Promise<IngestOutcome> {
    const startedAt = Date.now()
    const {round, trigger, canFinalise} = check

    try {
        const ingested = await ingestRound(seasonId, round)

        if (ingested.skipped) {
            await record('round', seasonId, round, trigger, 'skipped', startedAt, ingested.skipped)
            return 'skipped'
        }

        if (!ingested.changed) {
            // Nothing moved. Once the last checkpoint has passed, that is the
            // signal the classification has settled.
            if (canFinalise) await finalise(seasonId, round)
            await record('round', seasonId, round, trigger, 'unchanged', startedAt,
                canFinalise ? 'unchanged; finalised' : 'unchanged')
            return 'unchanged'
        }

        await rescoreFrom(seasonId, round)

        const laterRounds = await Results.findAll({
            attributes: ['round'],
            where: {seasonId, round: {[Op.gte]: round}},
            group: ['round'],
            order: [['round', 'ASC']]
        })
        for (const row of laterRounds) {
            await scoreTeamRound(seasonId, row.get('round') as number)
        }

        await record('round', seasonId, round, trigger, 'ingested', startedAt,
            `${ingested.entries} entries; rescored ${laterRounds.length} round(s)`, true)
        return 'ingested'
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        logger.error(`scheduler: ${seasonId} r${round} failed — ${detail}`)
        await record('round', seasonId, round, trigger, 'failed', startedAt, detail)
        return 'failed'
    }
}

export interface TickSummary {
    seasonId: number | null
    due: number
    outcomes: Array<{round: number; trigger: string; outcome: IngestOutcome}>
}

/**
 * One scheduler tick: find what is owed and do it.
 *
 * Cheap by design — on a week with no racing this is a single query returning
 * nothing due, and no upstream request is made.
 */
export async function tick(now = new Date()): Promise<TickSummary> {
    const season = await getActiveSeason()
    if (!season) {
        logger.warn('scheduler: no active season, nothing to do')
        return {seasonId: null, due: 0, outcomes: []}
    }
    const seasonId = season.get('seasonId') as number

    const due = dueRounds(await roundStates(seasonId), now)
    if (due.length === 0) return {seasonId, due: 0, outcomes: []}

    logger.info(`scheduler: ${due.length} round(s) due — ${due.map(d => `r${d.round}/${d.trigger}`).join(', ')}`)

    const outcomes = []
    for (const check of due) {
        outcomes.push({
            round: check.round,
            trigger: check.trigger,
            outcome: await runCheck(seasonId, check)
        })
    }
    return {seasonId, due: due.length, outcomes}
}

/**
 * Weekly calendar refresh.
 *
 * Also re-syncs drivers and constructors: mid-season line-up changes are the
 * main reason a round's ingest reports an unknown driver.
 */
export async function syncSeason(): Promise<void> {
    const season = await getActiveSeason()
    if (!season) {
        logger.warn('scheduler: no active season, skipping weekly sync')
        return
    }
    const seasonId = season.get('seasonId') as number

    const startedAt = Date.now()
    try {
        const races = await ingestSchedule(seasonId)
        await record('schedule', seasonId, null, 'weekly', 'ingested', startedAt, `${races} races`)
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        await record('schedule', seasonId, null, 'weekly', 'failed', startedAt, detail)
        logger.error(`scheduler: schedule sync failed — ${detail}`)
    }

    const driversStartedAt = Date.now()
    try {
        const counts = await ingestDriversAndTeams(seasonId)
        await record('drivers', seasonId, null, 'weekly', 'ingested', driversStartedAt,
            `${counts.drivers} drivers, ${counts.teams} teams`)
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        await record('drivers', seasonId, null, 'weekly', 'failed', driversStartedAt, detail)
        logger.error(`scheduler: driver sync failed — ${detail}`)
    }
}

export interface SeasonRefreshSummary {
    seasonId: number
    races: number
    drivers: number
    teams: number
    rounds: Array<{round: number; outcome: IngestOutcome; detail: string}>
}

/**
 * Rebuilds a whole season from the upstream in one pass: calendar, then the
 * driver and constructor line-up, then every round that has been run, then the
 * scores derived from all of it.
 *
 * This is the "new season" path. Starting one used to mean running the backfill
 * script on the host with database credentials to hand, because the admin
 * screens could only reach one round at a time — so the season's first sync was
 * the one operation the app itself could not do.
 *
 * Every step is an upsert, so this is safe to re-run at any point in a season;
 * on a season already up to date it costs the upstream requests and changes
 * nothing.
 */
export async function refreshSeason(seasonId: number): Promise<SeasonRefreshSummary> {
    const startedAt = Date.now()

    const scheduleStartedAt = Date.now()
    const races = await ingestSchedule(seasonId)
    await record('schedule', seasonId, null, 'manual', 'ingested', scheduleStartedAt, `${races} races`)

    // Before the rounds, never after: ingestRound drops any entry whose driver
    // or team it does not already know about.
    const lineUpStartedAt = Date.now()
    const counts = await ingestDriversAndTeams(seasonId)
    await record('drivers', seasonId, null, 'manual', 'ingested', lineUpStartedAt,
        `${counts.drivers} drivers, ${counts.teams} teams`)

    const calendar = await Race.findAll({where: {seasonId}, order: [['round', 'ASC']]})
    const rounds: SeasonRefreshSummary['rounds'] = []
    const ingestedRounds: number[] = []

    for (const race of calendar) {
        const round = race.get('round') as number
        const roundStartedAt = Date.now()
        try {
            const ingested = await ingestRound(seasonId, round)

            if (ingested.skipped) {
                await record('round', seasonId, round, 'manual', 'skipped', roundStartedAt, ingested.skipped)
                rounds.push({round, outcome: 'skipped', detail: ingested.skipped})
                continue
            }

            const detail = `${ingested.entries} entries`
            await record('round', seasonId, round, 'manual', 'ingested', roundStartedAt, detail, ingested.changed)
            rounds.push({round, outcome: 'ingested', detail})
            ingestedRounds.push(round)
        } catch (error) {
            // One unreachable round should not abandon the other twenty-three.
            // It is recorded and the pass carries on; re-running picks it up.
            const detail = error instanceof Error ? error.message : String(error)
            logger.error(`scheduler: ${seasonId} r${round} refresh failed — ${detail}`)
            await record('round', seasonId, round, 'manual', 'failed', roundStartedAt, detail)
            rounds.push({round, outcome: 'failed', detail})
        }
    }

    // Scored in round order: the rolling average and the salary ladder both
    // read the previous round, so order matters.
    for (const round of ingestedRounds) {
        await scoreRound(seasonId, round)
        await scoreTeamRound(seasonId, round)
    }

    const failed = rounds.filter(r => r.outcome === 'failed').length
    await record('season', seasonId, null, 'manual', failed ? 'failed' : 'ingested', startedAt,
        `${ingestedRounds.length}/${calendar.length} rounds scored, ${counts.drivers} drivers, `
        + `${counts.teams} teams${failed ? `, ${failed} round(s) failed` : ''}`)

    logger.info(`scheduler: ${seasonId} refreshed — ${ingestedRounds.length}/${calendar.length} rounds`)
    return {seasonId, races, drivers: counts.drivers, teams: counts.teams, rounds}
}

/** Manual single-round run, used by the admin endpoint. */
export async function runRoundManually(seasonId: number, round: number) {
    const startedAt = Date.now()
    const ingested = await ingestRound(seasonId, round)

    if (ingested.skipped) {
        await record('round', seasonId, round, 'manual', 'skipped', startedAt, ingested.skipped)
        return {ingested, drivers: null, teams: null}
    }

    const drivers = await scoreRound(seasonId, round)
    const teams = await scoreTeamRound(seasonId, round)
    await record('round', seasonId, round, 'manual', 'ingested', startedAt,
        `${ingested.entries} entries`, ingested.changed)

    return {ingested, drivers, teams}
}
