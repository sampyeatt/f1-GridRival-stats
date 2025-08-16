import {Request, Response} from 'express'
import {
    getResutlsByRound
} from '../services/results.service'
import _ from 'lodash'
import {z} from 'zod'
import {getRaceDataByMeetingKey, getRacesBySeasonId} from '../services/race.services'
import {BaseSalaryTeam, QualiPointsTeam, RacePointsTeam} from '../shared/constants'
import {
    bulkAddTeamResults, findSalaryBracketTeamResults,
    getTeamResults,
    getTeamResultsByRound,
    getTotalSalaryAndPosDiffTeam, teamResultsToAdd
} from '../services/teamresults.service'
import {TeamResults} from '../models/TeamResults'
import {getRaceByRound, getRacesByYear} from '../shared/f1api.util'
import {Meeting} from '../shared/interface.util'

export const getTeamResultsController = async (req: Request, res: Response) => {
    const seasonId = 2025
    const results = _.map(await getTeamResults(+seasonId), result => result.toJSON())
    res.json(results)
}

export const getTeamResultsByRoundController = async (req: Request, res: Response) => {
    if (_.isNil(req.params.seasonId) || _.isNil(req.params.round)) throw new Error('SeasonId parameter is required')
    const {seasonId, round} = req.params
    const results = await getTeamResultsByRound(+seasonId, +round)

    res.json(results)
}

export const addTeamResultStartController = async (req: Request, res: Response) => {
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
    const schemaValidator = schema.safeParse(req.body.data)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })

    const created = await bulkAddTeamResults(req.body.data as unknown as TeamResults[])
    res.json(created)
}

export const addTeamResultBulkController = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number(),
        meeting_key: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })
    const {seasonId, meeting_key} = req.body

    const teamResults = await teamResultsToAdd(seasonId, meeting_key)

    const created = await bulkAddTeamResults(teamResults as unknown as TeamResults[])

    res.json(created)
}

export const getTeamResultsToAddController = async (req: Request, res: Response) => {
    const seasonId = 2025
    const dbRaces = _.map(await getRacesBySeasonId(+seasonId), race => race.toJSON())
    const races: Meeting[] = await getRacesByYear(+seasonId)
    const diff: Meeting = _.minBy(_.reject(_.differenceBy(races, dbRaces, 'meeting_key'), {meeting_name: 'Pre-Season Testing'}), 'date_start') as Meeting
    console.log('diff', diff)

    const teamResults = await teamResultsToAdd(seasonId, diff.meeting_key)
    res.json(teamResults)

}