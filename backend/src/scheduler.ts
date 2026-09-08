import cron, {ScheduledTask} from 'node-cron'
import logger from './shared/logger.util'
import {syncSeason, tick} from './services/scheduler.service'

/**
 * Two cron jobs, both in the web process.
 *
 * That is deliberate at this size: the app is already a long-lived Express
 * process, and a separate worker would mean another container and another
 * deploy for two jobs that between them are idle most weeks. Because every
 * decision is derived from timestamps in the database, running a second
 * instance would duplicate work but not corrupt anything — ingest is an upsert
 * throughout.
 *
 * Set SCHEDULER_ENABLED=false to run the API without them.
 */

const TICK_CRON = process.env.SCHEDULER_TICK_CRON ?? '*/15 * * * *'   // every 15 minutes
const SYNC_CRON = process.env.SCHEDULER_SYNC_CRON ?? '0 3 * * 1'      // Mondays, 03:00

let tasks: ScheduledTask[] = []
let running = false

/** Prevents a slow run from overlapping the next tick. */
async function guarded(name: string, job: () => Promise<unknown>): Promise<void> {
    if (running) {
        logger.warn(`scheduler: ${name} skipped, previous run still in progress`)
        return
    }
    running = true
    try {
        await job()
    } catch (error) {
        logger.error(`scheduler: ${name} threw — ${error instanceof Error ? error.message : String(error)}`)
    } finally {
        running = false
    }
}

export function startScheduler(): void {
    if (process.env.SCHEDULER_ENABLED === 'false') {
        logger.info('scheduler: disabled by SCHEDULER_ENABLED=false')
        return
    }
    if (tasks.length > 0) return

    tasks = [
        cron.schedule(TICK_CRON, () => void guarded('tick', () => tick())),
        cron.schedule(SYNC_CRON, () => void guarded('weekly sync', () => syncSeason()))
    ]

    logger.info(`scheduler: started (tick "${TICK_CRON}", weekly sync "${SYNC_CRON}")`)
}

export function stopScheduler(): void {
    for (const task of tasks) task.stop()
    tasks = []
}
