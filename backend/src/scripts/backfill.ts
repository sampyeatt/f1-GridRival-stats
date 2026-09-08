/**
 * Ingests and scores a whole season from Jolpica.
 *
 *   npm run backfill              the active season
 *   npm run backfill -- 2024      a specific season, which it makes the
 *                                 current one — the app follows it across
 *
 * Roughly 3 requests per round plus 3 season-level calls — about 75 for a full
 * season, well inside Jolpica's 500/hour. Safe to re-run: every write is an
 * upsert.
 *
 * The work itself is refreshSeason, the same function behind the admin screen's
 * "Rebuild season" button, so the two cannot drift apart. This script is
 * the way to run it without a browser — a first import, or a cron.
 */
import '../database/connection'
import {connection} from '../database/connection'
import {getActiveSeason, upsertSeason} from '../services/season.services'
import {refreshSeason} from '../services/scheduler.service'

async function main() {
    const argSeason = process.argv[2] ? Number(process.argv[2]) : undefined

    let seasonId = argSeason
    if (!seasonId) {
        const active = await getActiveSeason()
        if (!active) {
            console.error('No active season. Pass one explicitly: npm run backfill -- 2024')
            process.exit(1)
        }
        seasonId = active.get('seasonId') as number
    } else {
        await upsertSeason({seasonId, currentSeason: true})
    }

    console.log(`Backfilling ${seasonId}…`)
    const summary = await refreshSeason(seasonId)

    const scored = summary.rounds.filter(r => r.outcome === 'ingested')
    console.log(`${summary.races} races, ${summary.drivers} drivers, ${summary.teams} teams.`)
    console.log(`Ingested and scored ${scored.length} of ${summary.rounds.length} rounds.`)
    for (const round of summary.rounds.filter(r => r.outcome !== 'ingested')) {
        console.log(`  r${round.round}: ${round.outcome} — ${round.detail}`)
    }

    console.log('Done.')
    await connection.close()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
