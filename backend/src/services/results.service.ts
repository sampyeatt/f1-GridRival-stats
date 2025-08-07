import {Results} from '../models/Results'
import _ from 'lodash'
import {BeatingTeammatePoints, QualiPointsDriver, RacePointsDriver, SprintPointsDriver} from '../shared/constants'
import {regex} from 'zod'
import {Op} from 'sequelize'


export async function getResutls(seasonId: number) {
    return await Results.findAll({
        where: {
            seasonId: seasonId
        }
    })
}

export async function addResults(
    raceId: string,
    points: number,
    cost: number,
    seasonId: number,
    round: number,
    driverId: string,
    teamId: string) {
    const result = new Results()
    result.raceId = raceId
    result.points = points
    result.cost = cost
    result.seasonId = seasonId
    result.round = round
    result.driverId = driverId
    result.teamId = teamId
    return Results.build(result).save()
}

export async function getTotalPointsDriver(driverId: string, qualiPos: number,  racePos: number, sprintPos = 0, teammatePos: number, completion: string, totalLaps: number, seasonId: number, round: number) {
    const eightRaceAvg = Results.sum('finishPosition', {
        where: {
            driverId: driverId,
            seasonId: seasonId,
            round: {
                [Op.between]: [round - 8, round-1]
            }
        }
    }) ?? 0
    console.log('eightRaceAvg: ', eightRaceAvg)
    const quailPoints = QualiPointsDriver[String(qualiPos) as keyof typeof QualiPointsDriver]
    const racePoints = RacePointsDriver[String(racePos) as keyof typeof RacePointsDriver]
    const sprintPoints = SprintPointsDriver[String(sprintPos) as keyof typeof SprintPointsDriver]
    const beatTeammatePoints = BeatingTeammatePoints[String(Math.max(teammatePos - racePos, 0)) as keyof typeof BeatingTeammatePoints]
    const match = completion.match(/\((\d+)\)/);
    let lapsCompleted = totalLaps
    if (match) lapsCompleted = +match[1]!

    const completionPoints = await getCompletionPoints((lapsCompleted / totalLaps) * 100)
    const overtakePoints = Math.max((3 * (qualiPos - racePos)), 0)
    return _.sum([quailPoints, racePoints, sprintPoints, overtakePoints, beatTeammatePoints, completionPoints])
}

async function getCompletionPoints(percentage: number) {
    if (percentage < 25) return 0
    else if (percentage < 50) return 3
    else if (percentage < 75) return 6
    else if (percentage < 90) return 9
    else return 12
}