import {Request, Response} from 'express'
import _ from 'lodash'
import {z} from 'zod'
import {getRacesBySeasonId} from '../services/race.services'
import {
    bulkAddTeamResults,
    getTeamResults,
    getTeamResultsByRound,
    teamResultsToAdd, upsertTeamResultsBulk
} from '../services/teamresults.service'
import {TeamResults} from '../models/TeamResults'
import {getRacesByYear} from '../shared/f1api.util'
import {Meeting} from '../shared/interface.util'
import {getActiveSeason} from '../services/season.services'

export const getTeamResultsController = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number
    const results = _.map(await getTeamResults(+seasonId!), result => result.toJSON())
    res.json(results)
}

export const getTeamResultsByRoundController = async (req: Request, res: Response) => {
    if (_.isNil(req.params.round)) throw new Error('SeasonId parameter is required')
    const {round} = req.params
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number
    const results = await getTeamResultsByRound(+seasonId!, +round)

    res.json(results)
}

export const addTeamResultArrayController = async (req: Request, res: Response) => {
    const schema = z.array(z.object({
        raceId: z.string(),
        points: z.number(),
        cost: z.number(),
        seasonId: z.number(),
        round: z.number(),
        teamId: z.string(),
        positionDifference: z.number(),
        positionsForMoney: z.number(),
        easeToGainPoints: z.number(),
        rank: z.number(),
        meeting_key: z.number()
    }))
    const schemaValidator = schema.safeParse(req.body.results)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })

    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const teamResults = await getTeamResults(currentSeason.get('seasonId')!)
    const removedDuplicates = _.differenceBy(req.body.results, teamResults, 'meeting_key')
    const resultsAdded = await bulkAddTeamResults(removedDuplicates as unknown as TeamResults[])

    if (removedDuplicates.length !== 0) return res.status(200).json({message: 'Results not found', success: true})
}

export const addTeamResultBulkController = async (req: Request, res: Response) => {
    const schema = z.object({
        meeting_key: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })
    const {meeting_key} = req.body
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number

    const teamResults = await teamResultsToAdd(seasonId!, meeting_key)

    const created = await bulkAddTeamResults(teamResults as unknown as TeamResults[])

    res.json(created)
}

export const getTeamResultsToAddController = async (req: Request, res: Response) => {
    const schema = z.string()
    const schemaValidator = schema.safeParse(req.params.meeting_key)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })
    const meeting_key = req.params.meeting_key
    if (_.isNil(meeting_key)) throw new Error('Meeting key parameter is required')
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number
    const teamResults = await teamResultsToAdd(seasonId!, +meeting_key)
    res.json(teamResults)

}

export const importTeamResultsController = async (req: Request, res: Response) => {

    console.log('Request Body: ', req.body)
    const schema = z.array(z.object({
        id: z.number(),
        raceId: z.string(),
        points: z.number(),
        cost: z.number(),
        rank: z.number(),
        round: z.number(),
        positionDifference: z.number(),
        positionsForMoney: z.number(),
        easeToGainPoints: z.number(),
        teamId: z.string(),
        meeting_key: z.number(),
        seasonId: z.number(),
        createdAt: z.string(),
        updatedAt: z.string()
    }))
    const schemaValidator = schema.safeParse(req.body.data)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })

    const races = req.body.data
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    _.map(races, result => upsertTeamResultsBulk(_.omit(result, 'id')))
    res.json({message: 'Result imported queued for processing'})
}