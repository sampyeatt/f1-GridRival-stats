import {Request, Response} from 'express'
import {
    addResults, bulkAddResults, findSalaryBracket, getResultByRaceIdDriverId,
    getResutls,
    getResutlsByRound,
    getTotalPointsDriver, getTotalSalaryAndPosDiff
} from '../services/results.service'
import _ from 'lodash'
import {z} from 'zod'
import {
    getCurrentRaceResults,
    getRaceByRound
} from '../shared/f1api.util'
import {getRaceDataByMeetingKey} from '../services/race.services'
import {getActiveDrivers} from '../services/driver.service'
import {BaseSalaryDriver} from '../shared/constants'
import {Results} from '../models/Results'

export const getResultsController = async (req: Request, res: Response) => {
    console.log('req.params1', req.params)
    if (_.isNil(req.params.seasonId)) throw new Error('SeasonId parameter is required')
    const {seasonId} = req.params
    const results = await getResutls(+seasonId)
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
    const race = await getRaceDataByMeetingKey(meeting_key)
    if (!race) return res.status(404).json({message: 'Race DB not found'})
    const round = race.get('round')!
    const sprint_key = race.get('sprint_key')
    const quali_key = race.get('quali_key')
    const race_key = race.get('race_key')

    const weekendRaceResults = await getCurrentRaceResults(meeting_key)
    if (!weekendRaceResults) return res.status(404).json({message: 'Race not found'})
    const filtered = _.filter(weekendRaceResults, item => _.includes([race.get('sprint_key'), race.get('quali_key'), race.get('race_key')], item.session_key))
    const {laps, raceId} = _.get(await getRaceByRound(seasonId, round), '[0]', undefined)

    const raceResults = _.filter(filtered, {session_key: race_key})
    const qualiResults = _.filter(filtered, {session_key: quali_key})
    const sprintResults = _.filter(filtered, {session_key: sprint_key})
    const drivers = await getActiveDrivers()

    try {
        let fullResult = await Promise.all(_(filtered)
            .groupBy('driver_number')
            .map(async (value, key: string) => {
                const driver = drivers.find(driver => driver.get('driverNumber') === +key)
                if (!driver) return {message: `Driver not found: ${key}`}
                const driverId = driver.get('driverId')
                const teamId = driver.get('teamId')
                const teammate = drivers.find(mate => mate.get('teamId') === teamId && mate.get('driverId') !== driverId)
                if (!teammate) return {message: `Teammate not found for driver: ${key}`}

                const sprint = _.find(value, {session_key: sprint_key})
                const quali = _.find(value, {session_key: quali_key})
                const raceR = _.find(value, {session_key: race_key})
                const teammateResult = _.find(raceResults, {driver_number: teammate.get('driverNumber')})
                // if (!teammateResult) return {message: `Teammate ${teammate.get('driverId')} result not found for driver: ${driverId}`}
                let sprintPosition = null
                if (sprint) {
                    sprintPosition = (sprint.dnf || sprint.dns || sprint.dsq) ? _.findIndex(sprintResults, {driver_number: +key}) + 1 : sprint.position
                }

                const qualiPosition = (quali.dnf || quali.dns || quali.dsq) ? _.findIndex(qualiResults, {driver_number: +key}) + 1 : quali.position
                const racePosition = (!raceR) ? 20 : (raceR.dnf || raceR.dns || raceR.dsq) ? _.findIndex(raceResults, {driver_number: +key}) + 1 : raceR.position
                const teammatePos = (!teammateResult) ? 20 : (teammateResult.dnf || teammateResult.dns || teammateResult.dsq) ? _.findIndex(raceResults, {driver_number: teammateResult.driver_number!}) + 1 : teammateResult.position

                const numberOfLaps = (raceR) ? raceR.number_of_laps : teammateResult.number_of_laps
                const dnsdsq = (raceR) ? (raceR.dsq || raceR.dns) : !raceR

                const points = await getTotalPointsDriver(driverId!, teamId!, qualiPosition, racePosition, sprintPosition, teammatePos, numberOfLaps, laps, seasonId, round, dnsdsq)

                return {
                    driverId: driverId,
                    raceId: raceId,
                    points: points,
                    cost: -1,
                    seasonId: seasonId,
                    round: round,
                    finishPosition: racePosition,
                    teamId: teamId,
                    positionDifference: -1,
                    positionsForMoney: -1,
                    easeToGainPoints: -1,
                    rank: -1,
                    meeting_key: meeting_key
                }
            }).value())

        const entries = Object.entries(BaseSalaryDriver)
            .map(([key, value]) => Number(value))
        fullResult = _.orderBy(fullResult, ['points', 'finishPosition'], ['desc', 'asc'])

        fullResult = await Promise.all(_.orderBy(fullResult, ['points', 'finishPosition'], ['desc', 'asc']).map(async (value, key) => {
            value.rank = key + 1
            const {
                totalSalary,
                positionDifference
            } = await getTotalSalaryAndPosDiff(value.driverId!, value.seasonId, round, value.rank)

            value.cost = _.round(totalSalary, 1)
            value.positionDifference = positionDifference
            value.positionsForMoney = await findSalaryBracket(value.cost, entries)

            return value
        }).values())

        fullResult = await Promise.all(_.orderBy(fullResult, ['cost'], ['desc', 'asc']).map(async (value, key) => {
            value.easeToGainPoints = key + 1 - value.positionsForMoney!
            return value
        }))

        const resToCreate = await Promise.all(_.filter(fullResult, async result => {
            const checkResult = await getResultByRaceIdDriverId(result.raceId, result.driverId!)
            return !checkResult
        }))

        if (_.isEmpty(resToCreate)) return res.status(404).json({message: 'No results found'})
        const created = await bulkAddResults(resToCreate as unknown as Results[])

        res.json(fullResult)
    } catch (e: any) {
        console.log('e', e.message)
        return res.status(400).json({message: `Error adding results ${e.message}`})
    }

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