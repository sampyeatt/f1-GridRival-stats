import _ from 'lodash'
import {Race} from '../models/Race'
import {Driver} from '../models/Driver'
import {Team} from '../models/Team'
import {Results} from '../models/Results'
import {RawIngest} from '../models/RawIngest'
import {connection} from '../database/connection'
import logger from '../shared/logger.util'
import {
    getSeasonConstructors,
    getSeasonDrivers,
    getSeasonSchedule,
    getSessionClassification,
    JolpicaSession
} from '../shared/jolpica.util'
import {
    adaptConstructors,
    adaptDrivers,
    adaptSchedule,
    adaptWeekend,
    raceDistance
} from '../shared/jolpica.adapter'

/**
 * Ingest is idempotent throughout: every write is an upsert onto a composite
 * primary key, so re-running a round is free. That is what makes the scheduled
 * re-checks in Phase 4 possible, and it replaces the old application-level
 * dedup guard, which never actually filtered anything.
 */

async function recordRaw(
    seasonId: number,
    round: number | null,
    session: string,
    payload: unknown
): Promise<void> {
    await RawIngest.create({source: 'jolpica', seasonId, round, session, payload} as any)
}

/** Upserts the season's race calendar. Safe to re-run; totalLaps is preserved. */
export async function ingestSchedule(seasonId: number): Promise<number> {
    const rows = await getSeasonSchedule(seasonId)
    await recordRaw(seasonId, null, 'schedule', rows)

    const races = adaptSchedule(seasonId, rows)
    for (const race of races) {
        const existing = await Race.findOne({where: {seasonId, round: race.round}})
        // totalLaps is learned from the classification, not the schedule —
        // don't stomp it back to 0 on a re-sync.
        await Race.upsert({
            ...race,
            totalLaps: existing?.get('totalLaps') ?? 0
        } as any)
    }
    logger.info(`ingest: ${races.length} races for ${seasonId}`)
    return races.length
}

/** Upserts constructors, then drivers (drivers reference a team). */
export async function ingestDriversAndTeams(seasonId: number): Promise<{drivers: number; teams: number}> {
    const constructorRows = await getSeasonConstructors(seasonId)
    await recordRaw(seasonId, null, 'constructors', constructorRows)
    const teams = adaptConstructors(constructorRows)
    for (const team of teams) await Team.upsert(team as any)

    const driverRows = await getSeasonDrivers(seasonId)
    await recordRaw(seasonId, null, 'drivers', driverRows)
    const drivers = adaptDrivers(driverRows)

    // A driver's team is only knowable from a classification, so seed it from
    // the most recent round they appear in.
    const teamByDriver = await latestTeamByDriver(seasonId)

    let written = 0
    for (const driver of drivers) {
        const teamId = teamByDriver.get(driver.driverId)
        if (!teamId) {
            // Entered the season but has not started a race yet (reserve
            // drivers appear in the season list). Skipped rather than given a
            // fake team, which would corrupt the constructor standings.
            logger.warn(`ingest: no team yet for ${driver.driverId}, skipping`)
            continue
        }
        await Driver.upsert({...driver, teamId, active: true} as any)
        written++
    }
    logger.info(`ingest: ${written} drivers, ${teams.length} teams for ${seasonId}`)
    return {drivers: written, teams: teams.length}
}

/**
 * Reads each round's race classification to find who drove for whom.
 * Later rounds win, so a mid-season swap lands on the driver's current team.
 */
async function latestTeamByDriver(seasonId: number): Promise<Map<string, string>> {
    const races = await Race.findAll({where: {seasonId}, order: [['round', 'ASC']]})
    const map = new Map<string, string>()

    for (const race of races) {
        const round = race.get('round') as number
        const rows = await getSessionClassification(seasonId, round, 'results')
        if (rows.length === 0) continue          // not raced yet
        await recordRaw(seasonId, round, 'results', rows)
        for (const row of rows) {
            const driverId = row.Driver?.driverId
            const teamId = row.Constructor?.constructorId
            if (driverId && teamId) map.set(String(driverId), String(teamId))
        }
    }
    return map
}

export interface RoundIngestResult {
    round: number
    entries: number
    /** True when the upstream classification differs from what was stored. */
    changed: boolean
    skipped?: string
}

/**
 * Pulls one round's three classifications and writes the raw result rows.
 *
 * Points, cost and rank are deliberately NOT computed here — that is the
 * scoring engine's job in Phase 3. This writes the facts; scoring derives the
 * numbers from them. Existing scoring columns are preserved on re-ingest so a
 * classification correction does not blank them.
 */
export async function ingestRound(seasonId: number, round: number): Promise<RoundIngestResult> {
    const race = await Race.findOne({where: {seasonId, round}})
    if (!race) return {round, entries: 0, changed: false, skipped: 'race not in schedule — run the schedule sync first'}

    const sessions: JolpicaSession[] = ['results', 'qualifying', 'sprint']
    const [raceRows, qualiRows, sprintRows] = await Promise.all(
        sessions.map(s => getSessionClassification(seasonId, round, s))
    ) as [any[], any[], any[]]

    if (raceRows.length === 0) return {round, entries: 0, changed: false, skipped: 'not raced yet'}

    for (const [i, session] of sessions.entries()) {
        await recordRaw(seasonId, round, session, [raceRows, qualiRows, sprintRows][i])
    }

    const entries = adaptWeekend(raceRows, qualiRows, sprintRows)
    const distance = raceDistance(raceRows)

    const knownTeams = new Set((await Team.findAll()).map(t => t.get('teamId') as string))
    const knownDrivers = new Set((await Driver.findAll()).map(d => d.get('driverId') as string))

    // Compared before writing so the scheduler can tell a settled result from a
    // corrected one without a second round-trip to the API.
    const before = await Results.findAll({where: {seasonId, round}})
    const beforeByDriver = new Map(before.map(r => [r.get('driverId') as string, r]))
    let changed = before.length !== entries.length

    await connection.transaction(async transaction => {
        await Race.update({totalLaps: distance}, {where: {seasonId, round}, transaction})

        for (const entry of entries) {
            if (!knownTeams.has(entry.teamId) || !knownDrivers.has(entry.driverId)) {
                // A driver or team that appeared mid-season. Rather than fail
                // the whole round, note it — the caller re-syncs the lists and
                // runs the round again.
                logger.warn(`ingest: unknown driver/team ${entry.driverId}/${entry.teamId} in ${seasonId} r${round}`)
                continue
            }

            const existing = beforeByDriver.get(entry.driverId)
            if (!existing
                || existing.get('racePosition') !== entry.racePosition
                || existing.get('raceStatus') !== entry.raceStatus
                || existing.get('qualiPosition') !== entry.qualiPosition
                || existing.get('qualiStatus') !== entry.qualiStatus) {
                changed = true
            }

            await Results.upsert({
                seasonId,
                round,
                driverId: entry.driverId,
                teamId: entry.teamId,
                racePosition: entry.racePosition,
                raceStatus: entry.raceStatus,
                qualiPosition: entry.qualiPosition,
                qualiStatus: entry.qualiStatus,
                sprintPosition: entry.sprintPosition,
                lapsCompleted: entry.lapsCompleted,
                // Preserve whatever scoring has already written.
                points: existing?.get('points') ?? 0,
                cost: existing?.get('cost') ?? 0,
                rank: existing?.get('rank') ?? 0,
                positionDifference: existing?.get('positionDifference') ?? 0,
                positionsForMoney: existing?.get('positionsForMoney') ?? 0,
                easeToGainPoints: existing?.get('easeToGainPoints') ?? 0,
                provisional: true,
                ingestedAt: new Date()
            } as any, {transaction})
        }
    })

    logger.info(`ingest: ${seasonId} r${round} — ${entries.length} entries, ${distance} laps, changed=${changed}`)
    return {round, entries: entries.length, changed}
}

// A whole-season pass lives in scheduler.service's refreshSeason, which
// composes the three functions above and scores what it ingests. There was an
// ingestSeason here that did the ingest half only, leaving each caller to
// remember the scoring loop and the round order it has to run in.

export const __testing = {latestTeamByDriver}
