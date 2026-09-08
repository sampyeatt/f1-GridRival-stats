import {NextFunction, Request, Response} from 'express'
import {z} from 'zod'
import {IngestRun} from '../models/IngestRun'
import {getActiveSeason} from '../services/season.services'
import {refreshSeason, roundStates, runRoundManually, syncSeason, tick} from '../services/scheduler.service'
import {dueRounds} from '../services/checkpoints'

async function activeSeasonId(res: Response): Promise<number | null> {
    const season = await getActiveSeason()
    if (!season) {
        res.status(404).json({message: 'Active Season not found'})
        return null
    }
    return season.get('seasonId') as number
}

/** What the scheduler would do right now, without doing it. */
export const schedulerStatusController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return

        const states = await roundStates(seasonId)
        const now = new Date()

        res.json({
            seasonId,
            now,
            due: dueRounds(states, now),
            rounds: states.map(s => ({
                round: s.round,
                startsAt: s.startsAt,
                lastIngestedAt: s.lastIngestedAt,
                provisional: s.provisional
            }))
        })
    } catch (error) {
        next(error)
    }
}

/** Recent scheduler activity — what ran, what changed, what failed. */
export const ingestRunsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = z.coerce.number().int().min(1).max(200).catch(50).parse(req.query.limit)
        res.json(await IngestRun.findAll({order: [['startedAt', 'DESC']], limit}))
    } catch (error) {
        next(error)
    }
}

/** Forces a tick now rather than waiting for the next one. */
export const runTickController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await tick())
    } catch (error) {
        next(error)
    }
}

/** Forces the weekly calendar and line-up refresh. */
export const runSyncController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await syncSeason()
        res.json({message: 'Season synced', success: true})
    } catch (error) {
        next(error)
    }
}

/**
 * Rebuilds the active season end to end — calendar, line-up, results, scores.
 *
 * Slow by nature: three upstream requests per round. nginx allows 300s on
 * /api/ for exactly this call.
 */
export const refreshSeasonController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return

        res.json(await refreshSeason(seasonId))
    } catch (error) {
        next(error)
    }
}

/** Manual override for a single round, bypassing the checkpoint schedule. */
export const runRoundController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = z.coerce.number().int().positive().safeParse(req.params.round)
        if (!parsed.success) return res.status(400).json({message: 'round must be a positive integer'})

        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return

        res.json(await runRoundManually(seasonId, parsed.data))
    } catch (error) {
        next(error)
    }
}
