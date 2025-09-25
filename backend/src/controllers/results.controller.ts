import {Request, Response} from 'express'
import {
    addResults,
    bulkAddResults, getResultByRaceIdDriverId, getResultsObjToAdd,
    getResutls,
    getResutlsByRound,
    updateQulaiResults, upsertResultsBulk
} from '../services/results.service'
import _ from 'lodash'
import {z} from 'zod'
import {
    getCurrentRaceResults,
    getRacesByYear
} from '../shared/f1api.util'
import {getRacesBySeasonId} from '../services/race.services'
import {getActiveDrivers} from '../services/driver.service'
import {Results} from '../models/Results'
import {Meeting} from '../shared/interface.util'
import {getActiveSeason} from '../services/season.services'

export const getResultsController = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number
    const results = _.map(await getResutls(+seasonId!), result => result.toJSON())
    res.json(results)
}

export const getResultsByRoundController = async (req: Request, res: Response) => {
    if (_.isNil(req.params.round)) throw new Error('SeasonId parameter is required')
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number
    const {round} = req.params
    const results = await getResutlsByRound(+seasonId!, +round)

    res.json(results)
}

export const addResultBulkController = async (req: Request, res: Response) => {
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

    const resultsToCreate = await getResultsObjToAdd(seasonId!, meeting_key)
    const created = await bulkAddResults(resultsToCreate as unknown as Results[])

    res.json(created)
}

export const addResultArrayController = async (req: Request, res: Response) => {
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
    const schemaValidator = schema.safeParse(req.body.results)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error.issues
    })

    const {results} = req.body

    const resultsAdded = await Promise.all(_.map(results, async (result: Results) => {
        const checkResult = await getResultByRaceIdDriverId(result.raceId, result.driverId!)
        if (checkResult) return {message: 'Result already added'}
        return await addResults(result)
    }))

    console.log(resultsAdded)
    if (resultsAdded.length !== 0) return res.status(200).json({message: 'Results not found', success: true})
}

export const updateResultsController = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number
    const races = await getRacesBySeasonId(+seasonId!)
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

export const getDriverResultsToAddController = async (req: Request, res: Response) => {

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
    const newRaces = await getResultsObjToAdd(seasonId, +meeting_key)

    res.json(newRaces)
}

export const importRaceDataController = async (req: Request, res: Response) => {

    console.log('Request Body: ', req.body)
    const schema = z.array(z.object({
        id: z.number(),
        raceId: z.string(),
        points: z.number(),
        cost: z.number(),
        rank: z.number(),
        round: z.number(),
        finishPosition: z.number(),
        qualiPosition: z.number(),
        qualiDNS: z.boolean(),
        raceDNS: z.boolean(),
        qualiDSQ: z.boolean(),
        raceDSQ: z.boolean(),
        positionDifference: z.number(),
        positionsForMoney: z.number(),
        easeToGainPoints: z.number(),
        driverId: z.string(),
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
    _.map(races, result => upsertResultsBulk(_.omit(result, 'id')))
    res.json({message: 'Result imported queued for processing'})
}