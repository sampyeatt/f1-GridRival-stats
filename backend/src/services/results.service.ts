import {Results} from '../models/Results'
import _ from 'lodash'
import {
    BaseSalaryDriver,
    BeatingTeammatePoints,
    ImprovedPoints,
    QualiPointsDriver,
    RacePointsDriver,
    SprintPointsDriver
} from '../shared/constants'
import {Op} from 'sequelize'


export async function getResutls(seasonId: number) {
    return await Results.findAll({
        where: {
            seasonId: seasonId
        },
        order: [['cost', 'DESC']]
    })
}


export async function getResutlsByRound(seasonId: number, round: number) {
    return await Results.findAll({
        where: {
            seasonId: seasonId,
            round: round
        },
        order: [['cost', 'DESC']]
    })
}

export function addResults(
    raceId: string,
    points: number,
    cost: number,
    seasonId: number,
    round: number,
    driverId: string,
    teamId: string,
    finishPosition: number,
    positionDifference: number,
    positionsForMoney: number,
    easeToGainPoints: number,
    rank: number) {
    const result = new Results()
    result.raceId = raceId
    result.points = points
    result.cost = cost
    result.seasonId = seasonId
    result.round = round
    result.driverId = driverId
    result.teamId = teamId
    result.finishPosition = finishPosition
    result.positionDifference = positionDifference
    result.positionsForMoney = positionsForMoney
    result.easeToGainPoints = easeToGainPoints
    result.rank = rank
    return Results.build(result).save()
}

export async function getTotalPointsDriver(driverId: string, qualiPos: number, racePos: number, sprintPos = 0, teammatePos: number, completion: string, totalLaps: number, seasonId: number, round: number) {

    const eightRaceAvg = (await Results.sum('finishPosition', {
        where: {
            driverId: driverId,
            seasonId: seasonId,
            round: {
                [Op.between]: [Math.max(round - 8, 0), round - 1]
            }
        }
    }) ?? 0) / ((round - 1) - Math.max(round - 8, 0) || 1)
    const quailPoints = QualiPointsDriver[String(qualiPos) as keyof typeof QualiPointsDriver]
    const racePoints = RacePointsDriver[String(racePos) as keyof typeof RacePointsDriver]
    const sprintPoints = SprintPointsDriver[String(sprintPos) as keyof typeof SprintPointsDriver]
    const beatTeammatePoints = BeatingTeammatePoints[String(Math.max(teammatePos - racePos, 0)) as keyof typeof BeatingTeammatePoints]
    const improvedPoints = ImprovedPoints[String(_.round(eightRaceAvg - racePos, 0)) as keyof typeof ImprovedPoints]
    const match = completion.match(/\((\d+)\)/)
    let lapsCompleted = totalLaps
    if (match) lapsCompleted = +match[1]!

    if(driverId === 'max_verstappen') {

        console.log(`Driver: ${driverId}`)
        console.log(`QualiPos: ${qualiPos}`)
        console.log(`RacePos: ${racePos}`)
        console.log(`SprintPos: ${sprintPos}`)
        console.log(`TeammatePos: ${teammatePos}`)
        console.log(`Completion: ${completion}`)
        console.log(`EightRaceAvg: ${eightRaceAvg}`)
        console.log(`QuailPoints: ${quailPoints}`)
        console.log(`RacePoints: ${racePoints}`)
        console.log(`SprintPoints: ${sprintPoints}`)
        console.log(`BeatTeammatePoints: ${beatTeammatePoints}`)
        console.log(`ImprovedPoints: ${improvedPoints}`)
        console.log(`LapsCompleted: ${lapsCompleted}`)
        console.log(`TotalLaps: ${totalLaps}`)
        console.log(`----------------------------------------`)
    }

    const completionPoints = await getCompletionPoints((lapsCompleted / totalLaps) * 100)
    const overtakePoints = Math.max((qualiPos - racePos), 0) * 3
    return _.sum([quailPoints, racePoints, sprintPoints, overtakePoints, beatTeammatePoints, completionPoints, improvedPoints])
}

async function getCompletionPoints(percentage: number): Promise<number> {
    if (percentage < 25) return 0
    else if (percentage < 50) return 3
    else if (percentage < 75) return 6
    else if (percentage < 90) return 9
    else return 12
}

export async function getTotalSalaryAndPosDiff(driverId: string, seasonId: number, round: number, driverRankAndSalary: number) {
    const results = await Results.findOne({
        where: {
            driverId: driverId,
            seasonId: seasonId,
            round: round - 1
        }
    })
    if (!results) return{
        totalSalary: 0,
        positionDifference: 0
    }
    const differ = (BaseSalaryDriver[String(driverRankAndSalary) as keyof typeof BaseSalaryDriver] - results.get('cost')!)

    const posDiff = Math.max(-2, Math.min(2, (Math.sign(differ) * _.floor(( Math.sign(differ) * differ / 4), 1))))

    if(driverId === 'max_verstappen') {
        console.log(`differ: ${differ}`)
        console.log(`posDiff: ${posDiff}`)
    }
    return {
        totalSalary: (posDiff + results.get('cost')!),
        positionDifference: posDiff
    }
}

export async function bulkAddResults(results: Results[]) {
    return await Results.bulkCreate(results)
}

export async function findSalaryBracket(salary: number, entries: number[]) {

    const found = _.findIndex(entries, (val, i) => {
        const prevVal = entries[i+1]
        return salary <= val! && salary > prevVal!
    })

    return found ? found+1 : 404
}