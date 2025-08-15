import {Request, Response} from 'express'
import {
    addResults, bulkAddResults, findSalaryBracket, getResultByRaceIdDriverId, getResultsObjToAdd,
    getResutls,
    getResutlsByRound,
    getTotalPointsDriver, getTotalSalaryAndPosDiff, updateQulaiResults
} from '../services/results.service'
import _ from 'lodash'
import {z} from 'zod'
import {
    getCurrentRaceResults,
    getRaceByRound, getRacesByYear
} from '../shared/f1api.util'
import {getRaceDataByMeetingKey, getSeasonBySeasonId} from '../services/race.services'
import {getActiveDrivers} from '../services/driver.service'
import {BaseSalaryDriver} from '../shared/constants'
import {Results} from '../models/Results'
import {all} from 'axios'
import {Meeting} from '../shared/interface.util'

export const getResultsController = async (req: Request, res: Response) => {
    console.log('req.params1', req.params)
    if (_.isNil(req.params.seasonId)) throw new Error('SeasonId parameter is required')
    const {seasonId} = req.params
    const results = _.map(await getResutls(+seasonId), result => result.toJSON())
    res.json(results)
}

export const getResultsByRoundController = async (req: Request, res: Response) => {
    console.log('req.params', req.params)
    if (_.isNil(req.params.seasonId) || _.isNil(req.params.round)) throw new Error('SeasonId parameter is required')
    const {seasonId, round} = req.params
    const results = await getResutlsByRound(+seasonId, +round)

    res.json(results)
}

export const addResultBulkController = async (req: Request, res: Response) => {
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

    const resultsToCreate = await getResultsObjToAdd(seasonId, meeting_key)
    const created = await bulkAddResults(resultsToCreate as unknown as Results[])

    res.json(created)
}

export const addResultArrayToStart = async (req: Request, res: Response) => {
    const schema = z.array(z.object({
        driverId: z.string(),
        raceId: z.string(),
        points: z.number(),
        cost: z.number(),
        seasonId: z.number(),
        round: z.number(),
        finishPosition: z.number(),
        teamId: z.string(),
        positionDifference: z.number(),
        positionsForMoney: z.number(),
        easeToGainPoints: z.number(),
        rank: z.number(),
        meeting_key: z.number()
    }))
    const schemaValidator = schema.safeParse(req.body.start)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })

    const {start} = req.body

    const resultsAdded = await Promise.all(_.map(start, async (result) => {
        const checkResult = await getResultByRaceIdDriverId(result.raceId, result.driverId)
        if (checkResult) return {message: 'Result already added'}
        return await addResults(result.raceId, result.points, result.cost, result.seasonId, result.round, result.driverId, result.teamId, result.finishPosition, result.positionDifference, result.positionsForMoney, result.easeToGainPoints, result.rank, result.meeting_key)
    }))

    res.json(resultsAdded)
}

export const updateResultsController = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })


    const {seasonId} = req.body
    const races = await getSeasonBySeasonId(+seasonId)
    const drivers = _.map(await getActiveDrivers(), drive => drive.toJSON())
    const allResults = _.flatten(await Promise.all(_.map(races, async race => {
        const meeting_key = race.get('meeting_key')
        return _.filter(await getCurrentRaceResults(meeting_key!), {session_key: race.get('quali_key')}).map((qualiR, index) => {
            if (qualiR.position === null) qualiR.position = index + 1
            qualiR.qualiDNS = qualiR.dns
            qualiR.qualiDSQ = qualiR.dsq
            return qualiR
        })
    })))

    const updated = await Promise.all(_.map(allResults, async result => {
        const driver = _.find(drivers, {driverNumber: result.driver_number})
        if (!driver) return {message: 'Driver not found'}
        return await updateQulaiResults(driver.driverId!, result.meeting_key, result.position, result.qualiDNS, result.qualiDSQ)
    }))

    res.json(updated)
}

export const getDriverResultsToAdd = async (req: Request, res: Response) => {
    console.log('TEST')
    if (!req.params.seasonId) throw new Error('SeasonId parameter is required')
    const seasonId = req.params.seasonId
    const dbRaces = _.map(await getSeasonBySeasonId(+seasonId), race => race.toJSON())
    const races: Meeting[] = await getRacesByYear(+seasonId)
    const diff: Meeting[] = _.reject(_.differenceBy(races, dbRaces, 'meeting_key'), {meeting_name: 'Pre-Season Testing'})
    if (diff.length === 0) return res.json({message: 'No new races to add'})
    const newRaces = await Promise.all(_.map(diff, async race => {
        return await getResultsObjToAdd(+seasonId, race.meeting_key)
    }))

    res.json(newRaces)
}