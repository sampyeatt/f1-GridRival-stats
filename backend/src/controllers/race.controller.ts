import {Request, Response, NextFunction} from 'express'
import _ from 'lodash'
import z from 'zod'
import {
    deleteRace,
    getRaceByRound,
    getRacesBySeasonId,
    updateRace
} from '../services/race.services'
import {getActiveSeason} from '../services/season.services'
import {ingestSchedule} from '../services/ingest.service'

/**
 * The previous addRaceBulk/addRace/updateCurrentSeason trio merged two upstream
 * payloads by array index and derived round numbers from list position. Jolpica
 * supplies the round directly, so all three collapse into one schedule sync.
 */

async function activeSeasonId(res: Response): Promise<number | null> {
    const season = await getActiveSeason()
    if (!season) {
        res.status(404).json({message: 'Active Season not found'})
        return null
    }
    return season.get('seasonId') as number
}

export const getRacesListController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return

        const races = await getRacesBySeasonId(seasonId)
        res.json(_.map(races, race => _.pick(race.toJSON(), ['round', 'raceName', 'hasSprint', 'date'])))
    } catch (error) {
        next(error)
    }
}

export const getAllRacesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return
        res.json(await getRacesBySeasonId(seasonId))
    } catch (error) {
        next(error)
    }
}

export const getRaceByRoundController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = z.coerce.number().int().positive().safeParse(req.params.round)
        if (!parsed.success) return res.status(400).json({message: 'round must be a positive integer'})

        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return

        const race = await getRaceByRound(seasonId, parsed.data)
        if (!race) return res.status(404).json({message: 'Race not found'})
        res.json(race.toJSON())
    } catch (error) {
        next(error)
    }
}

/** Pulls the calendar from Jolpica and upserts it. Safe to re-run. */
export const syncScheduleController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return

        const count = await ingestSchedule(seasonId)
        res.json({message: `Synced ${count} races`, count, success: true})
    } catch (error) {
        next(error)
    }
}

export const updateRaceController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({
            round: z.number().int().positive(),
            raceName: z.string().optional(),
            circuitName: z.string().optional(),
            country: z.string().optional(),
            locality: z.string().optional(),
            date: z.string().optional(),
            hasSprint: z.boolean().optional(),
            totalLaps: z.number().int().nonnegative().optional()
        })
        const parsed = schema.safeParse(req.body.data)
        if (!parsed.success) return res.status(400).json({
            message: 'Invalid request body',
            errors: parsed.error.issues
        })

        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return

        const {round, ...changes} = parsed.data
        const updated = await updateRace(seasonId, round, changes as any)
        if (!updated) return res.status(404).json({message: 'Race not found', success: false})

        res.json({message: 'Race updated', success: true, data: updated.toJSON()})
    } catch (error) {
        next(error)
    }
}

export const deleteRaceController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = z.coerce.number().int().positive().safeParse(req.params.round)
        if (!parsed.success) return res.status(400).json({message: 'round must be a positive integer'})

        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return

        const deleted = await deleteRace(seasonId, parsed.data)
        if (!deleted) return res.status(404).json({message: 'Race not found', success: false})
        res.status(200).json({message: 'Race deleted', success: true})
    } catch (error) {
        next(error)
    }
}
