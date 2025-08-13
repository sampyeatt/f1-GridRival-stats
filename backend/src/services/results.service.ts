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


export async function getResultByRaceIdDriverId(raceId: string, driverId: string) {
    return await Results.findOne({
        where: {
            raceId: raceId,
            driverId: driverId
        }
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
    rank: number,
    meeting_key: number) {
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
    result.meeting_key = meeting_key
    return Results.build(result).save()
}

export async function getTotalPointsDriver(driverId: string, teamId: string, qualiPos: number, racePos: number, sprintPos = 0, teammatePos: number, lapsCompleted: number, totalLaps: number, seasonId: number, round: number, dqed: boolean) {

    let eightRaceDB = (await Results.findAll({
        attributes: ['finishPosition', 'raceId', 'round'],
        where: {
            driverId: driverId,
            seasonId: seasonId,
            round: {
                [Op.between]: [Math.max(round - 8, 0), round - 1]
            }
        }
    }) ?? 0).map(item => item.toJSON())
    let eightRaceAvg = Math.ceil(_.sumBy(eightRaceDB, 'finishPosition') / 8)
    if (round < 8 ) {
        const originalPos = _.minBy(eightRaceDB, 'round')
        if (!originalPos) return 0
        eightRaceDB = _.reject(eightRaceDB, (item => item.round === originalPos.round))
        eightRaceAvg = Math.ceil((_.sumBy(eightRaceDB, 'finishPosition') + (originalPos.finishPosition! * (8-(round-1))))/8)
        if(driverId === 'norris') {
            console.log('eightRaceDB', eightRaceDB)
            console.log('eightRaceAvg', eightRaceAvg)
            console.log('originalPos', originalPos)
            console.log('round', round)
            console.log('----------------------------------------')
        }
    }
    const quailPoints = QualiPointsDriver[String(qualiPos) as keyof typeof QualiPointsDriver]
    const sprintPoints = SprintPointsDriver[String(sprintPos) as keyof typeof SprintPointsDriver]
    const racePoints = (!dqed) ? RacePointsDriver[String(racePos) as keyof typeof RacePointsDriver] : 0
    const beatTeammatePoints = (!dqed) ? BeatingTeammatePoints[String(Math.max(teammatePos - racePos, 0)) as keyof typeof BeatingTeammatePoints] : 0
    const improvedPoints = (!dqed) ? ImprovedPoints[String(_.round(eightRaceAvg - racePos, 0)) as keyof typeof ImprovedPoints] : 0
    const completionPoints = (!dqed) ? await getCompletionPoints((lapsCompleted / totalLaps) * 100) : 0
    const overtakePoints = (!dqed) ? Math.max((qualiPos - racePos), 0) * 3 : 0

    if(driverId === 'norris') {

        console.log(`----------------------------------------`)
        console.log(`Driver: ${driverId}`)
        console.log(`Round: ${round}`)
        console.log(`RacePos: ${racePos}`)
        console.log(`QualiPos: ${qualiPos}`)
        console.log(`Completion: ${lapsCompleted}`)
        console.log(`TotalLaps: ${totalLaps}`)
        console.log(`EightRaceAvg: ${eightRaceAvg}`)
        console.log(`TeammatePos: ${teammatePos}`)
        console.log(`SprintPos: ${sprintPos}`)
        console.log('******')
        console.log(`RacePoints: ${racePoints}`)
        console.log(`QuailPoints: ${quailPoints}`)
        console.log(`CompletionPoints: ${completionPoints}`)
        console.log(`OvertakePoints: ${overtakePoints}`)
        console.log(`ImprovedPoints: ${improvedPoints}`)
        console.log(`BeatTeammatePoints: ${beatTeammatePoints}`)
        console.log(`SprintPoints: ${sprintPoints}`)
        console.log(`----------------------------------------`)
    }


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
    const differ = _.round(BaseSalaryDriver[String(driverRankAndSalary) as keyof typeof BaseSalaryDriver] - results.get('cost')!, 1)

    const posDiff = Math.max(-2, Math.min(2, (Math.sign(differ) * _.floor(( Math.sign(differ) * differ / 4), 1))))

    if(driverId === 'colapinto') {
        console.log(`----------------------------------------`)
        console.log(`driverId: ${driverId}`)
        console.log(`differ: ${differ}`)
        console.log(`posDiff: ${posDiff}`)
        console.log(`results.cost: ${results.get('cost')!}`)
        console.log(`driverRankAndSalary: ${driverRankAndSalary}`)
        console.log(`BaseSalaryDriver[${driverRankAndSalary}]: ${BaseSalaryDriver[String(driverRankAndSalary) as keyof typeof BaseSalaryDriver]}`)
        console.log(`----------------------------------------`)
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