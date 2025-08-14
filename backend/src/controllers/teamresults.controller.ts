import {Request, Response} from 'express'
import {
    getResutlsByRound
} from '../services/results.service'
import _ from 'lodash'
import {z} from 'zod'
import {getRaceDataByMeetingKey} from '../services/race.services'
import {BaseSalaryTeam, QualiPointsTeam, RacePointsTeam} from '../shared/constants'
import {
    bulkAddTeamResults, findSalaryBracketTeamResults,
    getTeamResults,
    getTeamResultsByRound,
    getTotalSalaryAndPosDiffTeam
} from '../services/teamresults.service'
import {TeamResults} from '../models/TeamResults'
import {getRaceByRound} from '../shared/f1api.util'

export const getTeamResultsController = async (req: Request, res: Response) => {
    console.log('req.params1', req.params)
    if (_.isNil(req.params.seasonId)) throw new Error('SeasonId parameter is required')
    const {seasonId} = req.params
    const results = _.map(await getTeamResults(+seasonId), result => result.toJSON())
    res.json(results)
}

export const getTeamResultsByRoundController = async (req: Request, res: Response) => {
    console.log('req.params', req.params)
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
    const race = await getRaceDataByMeetingKey(meeting_key)
    if (!race) return res.status(404).json({message: 'Race DB not found'})
    const round = race.get('round')!
    const {raceId} = _.get(await getRaceByRound(seasonId, round), '[0]', undefined)

    const results = _.map(await getResutlsByRound(+seasonId, +round), result => result.toJSON())
    if (!results) return res.status(404).json({message: 'Race Results not found'})

    let teamResults = await Promise.all(_(results)
        .groupBy('teamId')
        .map(async (value, key: string) => {

            const points = _(value).map(driverResult => {
                const racePoint = (!driverResult.raceDNS && !driverResult.raceDSQ) ? RacePointsTeam[String(driverResult.finishPosition) as keyof typeof RacePointsTeam] : 0
                const qualiPoint = (!driverResult.qualiDSQ) ? QualiPointsTeam[String(driverResult.qualiPosition) as keyof typeof QualiPointsTeam] : 0
                return  (racePoint + qualiPoint)
            }).sum()
            if(key === 'alpine') {
                console.log('--------------------------------------------')
                console.log(`Team: ${key}`)
                console.log(`Points: ${points}`)
                _(value).forEach(driverResult => {
                    console.log(`RacePoints for ${driverResult.driverId}`, RacePointsTeam[String(driverResult.finishPosition) as keyof typeof RacePointsTeam])
                    console.log(`QualiPoints for ${driverResult.driverId}`, QualiPointsTeam[String(driverResult.qualiPosition) as keyof typeof QualiPointsTeam])
                })
                console.log('--------------------------------------------')
            }
        return {
            raceId: raceId,
            points: points,
            cost: -1,
            seasonId: seasonId,
            round: round,
            teamId: key,
            positionDifference: -1,
            positionsForMoney: -1,
            easeToGainPoints: -1,
            rank: -1,
            meeting_key: meeting_key
        }
    }).value())
    const entries = Object.entries(BaseSalaryTeam)
        .map(([key, value]) => Number(value))

    teamResults = await Promise.all(_.orderBy(teamResults, ['points'], ['desc']).map(async (value, key) => {
        value.rank = key + 1
        const {totalSalary, positionDifference} = await getTotalSalaryAndPosDiffTeam(value.teamId, value.seasonId, value.round, key + 1)
        value.cost = _.round(totalSalary, 1)
        value.positionDifference = positionDifference
        value.positionsForMoney = await findSalaryBracketTeamResults(value.cost, entries)
        return value
    }))

    teamResults = await Promise.all(_.orderBy(teamResults, ['cost'], ['desc']).map(async (value, key) => {
        value.easeToGainPoints = key + 1 - value.positionsForMoney!
        return value
    }))

    const created = await bulkAddTeamResults(teamResults as unknown as TeamResults[])

    res.json(teamResults)
}
