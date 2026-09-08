import {NextFunction, Request, Response} from 'express'
import _ from 'lodash'
import {z} from 'zod'
import {getTeamResults, getTeamResultsByRound} from '../services/teamresults.service'
import {getActiveSeason} from '../services/season.services'

async function activeSeasonId(res: Response): Promise<number | null> {
    const season = await getActiveSeason()
    if (!season) {
        res.status(404).json({message: 'Active Season not found'})
        return null
    }
    return season.get('seasonId') as number
}

export const getTeamResultsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return
        res.json(_.map(await getTeamResults(seasonId), r => r.toJSON()))
    } catch (error) {
        next(error)
    }
}

export const getTeamResultsByRoundController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = z.coerce.number().int().positive().safeParse(req.params.round)
        if (!parsed.success) return res.status(400).json({message: 'round must be a positive integer'})

        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return
        res.json(_.map(await getTeamResultsByRound(seasonId, parsed.data), r => r.toJSON()))
    } catch (error) {
        next(error)
    }
}
