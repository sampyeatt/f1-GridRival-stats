import {Request, Response} from 'express'
import {
    addResults, findSalaryBracket,
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
    if (_.isNil(req.params.seasonId)) throw new Error('SeasonId parameter is required')
    const results = await getResutls(+req.params.seasonId)

    res.json(results)
}

export const addResultController = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })

    const {seasonId} = req.body

    const quali = await getCurrentQualiResults(seasonId)
    const sprint = await getCurrentSprintResults(seasonId)
    const race = await getCurrentRaceResults(seasonId)
    const sprintData = (sprint !== null) ? sprint.races.sprintRaceResults : []
    const {raceId, round} = race.races
    const totalLaps = await getRaceByRound(seasonId, round)

    // let lastRaceResults = await getResutlsByRound(seasonId, round-1)
    // lastRaceResults = lastRaceResults.map(dataRes => dataRes.toJSON())
    // const driversRankAndSalary = _(lastRaceResults)
    //     .map((result, index) => {
    //         return _.set(result, 'Rank', index + 1)
    //     })
    //     .keyBy('driverId').values().toJSON()

    const zipped = await Promise.all(_(_.concat(quali.races.qualyResults, race.races.results, sprintData))
        .groupBy('driver.driverId')
        .map(async (value, key: string) => {
            const weekendData = _.merge(value[0], value[1], value[2] ?? {})
            const {sprintPosition, time} = weekendData
            let {gridPosition, position} = weekendData
            if (gridPosition === '-') gridPosition = _.findIndex(quali.races.qualyResults, {driverId: key}) + 1
            let teammatePos = _.find(race.races.results, (result) => result.driver.driverId !== key && result.team.teamId === weekendData.teamId).position
            if (teammatePos === 'NC') teammatePos = _.findIndex(race.races.results, (result: any) => result.driver.driverId !== key && result.team.teamId === weekendData.teamId) + 1
            if (position === 'NC') position = _.findIndex(race.races.results, (result: any) => result.driver.driverId === key) + 1
            const points = await getTotalPointsDriver(key, gridPosition, position, sprintPosition, teammatePos, time, totalLaps[0].laps, seasonId, round)

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
        })
        .sortBy('points').value())

    const fullResult = await Promise.all(zipped.map(async (value, key) => {
        value.rank = key+1
        const {
            totalSalary,
            positionDifference
        } = await getTotalSalaryAndPosDiff(value.driverId, value.seasonId, value.round, value.rank)

        value.cost = _.round(totalSalary, 1)
        value.positionDifference = positionDifference
        value.positionsForMoney = Number(await findSalaryBracket(totalSalary))
        value.easeToGainPoints = value.rank - value.positionsForMoney

        return value
    }).values())

    res.json(fullResult)
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