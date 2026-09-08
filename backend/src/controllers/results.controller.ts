import {NextFunction, Request, Response} from 'express'
import _ from 'lodash'
import {z} from 'zod'
import {getResutls, getResutlsByRound, rescoreFrom, scoreRound} from '../services/results.service'
import {scoreTeamRound} from '../services/teamresults.service'
import {getActiveSeason} from '../services/season.services'
import {ingestRound} from '../services/ingest.service'

async function activeSeasonId(res: Response): Promise<number | null> {
    const season = await getActiveSeason()
    if (!season) {
        res.status(404).json({message: 'Active Season not found'})
        return null
    }
    return season.get('seasonId') as number
}

const roundParam = z.coerce.number().int().positive()

export const getResultsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return
        res.json(_.map(await getResutls(seasonId), r => r.toJSON()))
    } catch (error) {
        next(error)
    }
}

export const getResultsByRoundController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = roundParam.safeParse(req.params.round)
        if (!parsed.success) return res.status(400).json({message: 'round must be a positive integer'})

        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return
        res.json(_.map(await getResutlsByRound(seasonId, parsed.data), r => r.toJSON()))
    } catch (error) {
        next(error)
    }
}

/**
 * Pulls one round from Jolpica and scores it — drivers, then constructors,
 * which are derived from the driver rows.
 *
 * Replaces the old fetch/preview/save dance across four endpoints. Idempotent,
 * so re-running a round after a stewards' decision is the supported path
 * rather than something to be avoided.
 */
export const ingestAndScoreRoundController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = z.object({round: z.number().int().positive()}).safeParse(req.body)
        if (!parsed.success) return res.status(400).json({
            message: 'Invalid request body',
            errors: parsed.error.issues
        })

        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return
        const {round} = parsed.data

        const ingested = await ingestRound(seasonId, round)
        if (ingested.skipped) {
            return res.status(409).json({message: ingested.skipped, success: false})
        }

        const drivers = await scoreRound(seasonId, round)
        const teams = await scoreTeamRound(seasonId, round)

        res.json({message: `Round ${round} ingested and scored`, success: true, ingested, drivers, teams})
    } catch (error) {
        next(error)
    }
}

/**
 * Re-scores a round and every round after it, without touching the upstream.
 *
 * The cascade matters: the rolling average feeds the next seven rounds and the
 * salary ladder chains from one round to the next, so re-scoring a round in
 * isolation would leave everything after it inconsistent.
 */
export const rescoreRoundController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = roundParam.safeParse(req.params.round)
        if (!parsed.success) return res.status(400).json({message: 'round must be a positive integer'})

        const seasonId = await activeSeasonId(res)
        if (seasonId === null) return
        const fromRound = parsed.data

        const drivers = await rescoreFrom(seasonId, fromRound)

        const teams = []
        for (const result of drivers) {
            if ('round' in result) teams.push(await scoreTeamRound(seasonId, result.round))
        }

        res.json({
            message: `Rescored ${drivers.length} round(s) from ${fromRound}`,
            success: true,
            drivers,
            teams
        })
    } catch (error) {
        next(error)
    }
}
