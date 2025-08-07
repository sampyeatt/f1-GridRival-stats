import {Request, Response} from 'express'
import {getResutls, getTotalPointsDriver} from '../services/results.service'
import _ from 'lodash'
import {z} from 'zod'
import {
    getCurrentQualiResults,
    getCurrentRaceResults,
    getCurrentSprintResults,
    getRaceByRound
} from '../shared/f1api.util'
import {ResultSet} from '../shared/interface.util'

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
    if (!schemaValidator.success) return res.status(400).json({message: 'Invalid request body', errors: schemaValidator.error})

    const {seasonId} = req.body

    const quali = await getCurrentQualiResults(seasonId)
    const sprint = await getCurrentSprintResults(seasonId)
    const race = await getCurrentRaceResults(seasonId)
    const sprintData = (sprint !== null) ? sprint.races.sprintRaceResults : []
    const {raceId, round} = race.races
    const {totalLaps} = await getRaceByRound(seasonId, round)




    const zipped = _(_.concat(quali.races.qualyResults, race.races.results, sprintData)).groupBy('driver.driverId').map((value, key) => {
        const weekendData = _.merge(value[0], value[1], value[2] ?? {})
        const {gridPosition, position, sprintPosition, time} = weekendData
        const teammatePos = _.find(race.races.results, (result) => result.driver.driverId !== key && result.team.teamId === weekendData.teamId)
        const points = getTotalPointsDriver(key, gridPosition,  position, sprintPosition, teammatePos, time, totalLaps, seasonId, round)
        const cost = 2
        return {
            driverId: key,
            raceId: raceId,
            points: points,
            cost: cost,
            seasonId: seasonId,
            round: round,
            finishPosition: position,
            teamId: weekendData.teamId,
        }
    })

    // const results = await getResutls(seasonId)

    res.json(zipped)
}