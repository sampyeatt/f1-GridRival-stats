import {Request, Response} from 'express'
import {
    addResults, bulkAddResults, findSalaryBracket,
    getResutls,
    getResutlsByRound,
    getTotalPointsDriver, getTotalSalaryAndPosDiff
} from '../services/results.service'
import _ from 'lodash'
import {z} from 'zod'
import {
    getCurrentQualiResults,
    getCurrentRaceResults,
    getCurrentSprintResults,
    getRaceByRound
} from '../shared/f1api.util'
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

export const addResultController = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number(),
        round: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })

    const {seasonId, round} = req.body

    const quali = await getCurrentQualiResults(seasonId, round)
    const sprint = await getCurrentSprintResults(seasonId, round)
    const race = await getCurrentRaceResults(seasonId, round)
    const sprintData = (sprint !== null) ? _.map(sprint.races.sprintRaceResults, (result) => {
        return {
            driverId: result.driverId,
            teamId: result.team.teamId,
            sprintPosition: result.position,
            driver: {
                driverId: result.driverId
            }
        }
    }) : []
    const {raceId} = race.races
    const totalLaps = await getRaceByRound(seasonId, round)
    const sortedWithoutDQs = _.reject(race.races.results, {position: '-'})
    const dqs = _.filter(race.races.results, {position: '-'})
    console.log('dqs', dqs)

    let fullResult = await Promise.all(_(_.concat(quali.races.qualyResults, race.races.results, sprintData))
        .groupBy('driver.driverId')
        .map(async (value, key: string) => {
            const weekendData = _.merge(value[0], value[1], value[2] ?? {})
            const {sprintPosition, time} = weekendData
            let {gridPosition, position} = weekendData
            let dqed = false
            if (gridPosition === '-') gridPosition = _.findIndex(quali.races.qualyResults, {driverId: key}) + 1
            let teammatePos = _.find(race.races.results, (result) => result.driver.driverId !== key && result.team.teamId === weekendData.teamId).position
            if (teammatePos === 'NC') teammatePos = _.findIndex(race.races.results, (result: any) => result.driver.driverId !== key && result.team.teamId === weekendData.teamId) + 1
            if (position === 'NC') position = _.findIndex(sortedWithoutDQs, (result: any) => result.driver.driverId === key) + 1
            if (position === '-') {
                dqed = true
                position = _.findIndex(dqs, (result: any) => result.driver.driverId === key) + sortedWithoutDQs.length + 1
            }
            const points = await getTotalPointsDriver(key, gridPosition, position, sprintPosition, teammatePos, time, totalLaps[0].laps, seasonId, round, dqed)

            return {
                driverId: key,
                raceId: raceId,
                points: points,
                cost: -1,
                seasonId: seasonId,
                round: round,
                finishPosition: position,
                teamId: weekendData.teamId,
                positionDifference: -1,
                positionsForMoney: -1,
                easeToGainPoints: -1,
                rank: -1
            }
        }).value())

    const entries = Object.entries(BaseSalaryDriver)
        .map(([key, value]) => Number(value))
    fullResult = _.orderBy(fullResult, ['points', 'finishPosition'], ['desc', 'asc'])

    fullResult = await Promise.all(_.orderBy(fullResult, ['points', 'finishPosition'], ['desc', 'asc']).map(async (value, key) => {
        value.rank = key+1
        const {
            totalSalary,
            positionDifference
        } = await getTotalSalaryAndPosDiff(value.driverId, value.seasonId, value.round, value.rank)

        value.cost = _.round(totalSalary, 1)
        value.positionDifference = positionDifference
        value.positionsForMoney = await findSalaryBracket(value.cost, entries)

        return value
    }).values())

    fullResult = await Promise.all(_.orderBy(fullResult, ['cost'], ['desc', 'asc']).map(async (value, key) => {
        value.easeToGainPoints = key+1 - value.positionsForMoney
        return value
    }))

    const created = await bulkAddResults(fullResult as unknown as Results[])

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
        rank: z.number()
    }))
    const schemaValidator = schema.safeParse(req.body.start)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })

    const {start} = req.body

    const resultsAdded = _.map(start, async (result) => {
        return await addResults(result.raceId, result.points, result.cost, result.seasonId, result.round, result.driverId, result.teamId, result.finishPosition, result.positionDifference, result.positionsForMoney, result.easeToGainPoints, result.rank)
    })

    res.json(resultsAdded)
}