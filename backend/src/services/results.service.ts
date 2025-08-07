import {Results} from '../models/Results'
import _ from 'lodash'
import {BeatingTeammatePoints, QualiPointsDriver, RacePointsDriver, SprintPointsDriver} from '../shared/constants'
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

export function getTotalPointsDriver(driverId: string, qualiPos: number,  racePos: number, sprintPos = 0, teammatePos: number, completion: string, totalLaps: number, seasonId: number, round: number) {
    // const eightRaceAvg = await Results.sum('finishPosition', {
    //     where: {
    //         driverId: driverId,
    //         seasonId: seasonId,
    //         round: {
    //             [Op.between]: [Math.max(round - 8, 1), round - 1]
    //         }
    //     }
    // }) ?? 0
    if (driverId === 'hulkenberg') {
        console.log('***', driverId, '***')
        console.log('qualiPos: ', qualiPos, ' racePos: ', racePos, ' sprintPos: ', sprintPos, ' teammatePos: ', teammatePos)
        console.log('completion: ', completion, ' totalLaps: ', totalLaps)
        console.log('beattmby',String(Math.max(teammatePos - racePos, 0)))

    }

    const eightRaceAvg = 0
    const quailPoints = QualiPointsDriver[String(qualiPos) as keyof typeof QualiPointsDriver]
    const racePoints = RacePointsDriver[String(racePos) as keyof typeof RacePointsDriver]
    const sprintPoints = SprintPointsDriver[String(sprintPos) as keyof typeof SprintPointsDriver]
    const beatTeammatePoints = BeatingTeammatePoints[String(Math.max(teammatePos - racePos, 0)) as keyof typeof BeatingTeammatePoints]
    const match = completion.match(/\((\d+)\)/);
    let lapsCompleted = totalLaps
    if (match) lapsCompleted = +match[1]!

    const completionPoints = getCompletionPoints((lapsCompleted / totalLaps) * 100)
    const overtakePoints = Math.max((qualiPos - racePos), 0)*3
    if (driverId === 'hulkenberg'){
        console.log('racePoints: ', racePoints, ' quailPoints: ', quailPoints, ' overtakePoints: ', overtakePoints, ' beatTeammatePoints: ', beatTeammatePoints, ' completionPoints: ', completionPoints)
    }
    return _.sum([quailPoints, racePoints, sprintPoints, overtakePoints, beatTeammatePoints, completionPoints])
}

function getCompletionPoints(percentage: number): number {
    if (percentage < 25) return 0
    else if (percentage < 50) return 3
    else if (percentage < 75) return 6
    else if (percentage < 90) return 9
    else return 12
}