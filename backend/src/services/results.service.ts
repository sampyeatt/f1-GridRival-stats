import {Results} from '../models/Results'
import _, {rest} from 'lodash'
import {
    BaseSalaryDriver,
    BeatingTeammatePoints,
    ImprovedPoints,
    QualiPointsDriver,
    RacePointsDriver,
    SprintPointsDriver
} from '../shared/constants'
import {Op} from 'sequelize'
import {getRaceDataByMeetingKey} from './race.services'
import {getCurrentRaceResults, getRaceByRound} from '../shared/f1api.util'
import {getActiveDrivers} from './driver.service'


export async function getResutls(seasonId: number) {
    return await Results.findAll({
        where: {
            seasonId: seasonId
        },
        order: [['cost', 'DESC']],
        include: ['driver']
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
    if (round < 8) {
        const originalPos = _.minBy(eightRaceDB, 'round')
        if (!originalPos) return 0
        eightRaceDB = _.reject(eightRaceDB, (item => item.round === originalPos.round))
        eightRaceAvg = Math.ceil((_.sumBy(eightRaceDB, 'finishPosition') + (originalPos.finishPosition! * (8 - (round - 1)))) / 8)
    }
    const quailPoints = QualiPointsDriver[String(qualiPos) as keyof typeof QualiPointsDriver]
    const sprintPoints = SprintPointsDriver[String(sprintPos) as keyof typeof SprintPointsDriver]
    const racePoints = (!dqed) ? RacePointsDriver[String(racePos) as keyof typeof RacePointsDriver] : 0
    const beatTeammatePoints = (!dqed) ? BeatingTeammatePoints[String(Math.max(teammatePos - racePos, 0)) as keyof typeof BeatingTeammatePoints] : 0
    const improvedPoints = (!dqed) ? ImprovedPoints[String(_.round(eightRaceAvg - racePos, 0)) as keyof typeof ImprovedPoints] : 0
    const completionPoints = (!dqed) ? await getCompletionPoints((lapsCompleted / totalLaps) * 100) : 0
    const overtakePoints = (!dqed) ? Math.max((qualiPos - racePos), 0) * 3 : 0
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
    if (!results) return {
        totalSalary: 0,
        positionDifference: 0
    }
    const differ = _.round(BaseSalaryDriver[String(driverRankAndSalary) as keyof typeof BaseSalaryDriver] - results.get('cost')!, 1)
    const posDiff = Math.max(-2, Math.min(2, (Math.sign(differ) * _.floor((Math.sign(differ) * differ / 4), 1))))
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
        const prevVal = entries[i + 1]
        return salary <= val! && salary > prevVal!
    })

    return found + 1
}

export async function updateQulaiResults(driverId: string, meeting_key: number, qualiPosition: number, dns: boolean, dsq: boolean) {
    const result = await Results.findOne({
        where: {
            driverId: driverId,
            meeting_key: meeting_key
        }
    })
    if (!result) return undefined
    result.set({qualiPosition: qualiPosition, qualiDNS: dns, qualiDSQ: dsq})
    return await result.save()
}

export async function getResultsObjToAdd(seasonId: number, meeting_key: number) {
    const race = await getRaceDataByMeetingKey(meeting_key)
    if (!race) return {message: 'Race DB not found'}
    const round = race.get('round')!
    const sprint_key = race.get('sprint_key')
    const quali_key = race.get('quali_key')
    const race_key = race.get('race_key')

    const weekendRaceResults = await getCurrentRaceResults(meeting_key)
    if (!weekendRaceResults) return {message: 'Race not found'}
    const filtered = _.filter(weekendRaceResults, item => _.includes([race.get('sprint_key'), race.get('quali_key'), race.get('race_key')], item.session_key))
    const {laps, raceId} = _.get(await getRaceByRound(seasonId, round), '[0]', undefined)

    const raceResults = _.filter(filtered, {session_key: race_key})
    const qualiResults = _.filter(filtered, {session_key: quali_key})
    const sprintResults = _.filter(filtered, {session_key: sprint_key})
    const drivers = await getActiveDrivers()
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
            if (!teammateResult) return {message: `Teammate ${teammate.get('driverId')} result not found for driver: ${driverId}`}
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
                qualiPosition: qualiPosition,
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

    fullResult = await Promise.all(_.orderBy(fullResult, ['points', 'finishPosition'], ['desc', 'asc']).map(async (value, key) => {
        value.rank = key + 1
        const {
            totalSalary,
            positionDifference
        } = await getTotalSalaryAndPosDiff(value.driverId!, value.seasonId!, round, value.rank)

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

    if (_.isEmpty(resToCreate)) return {message: 'No results found'}

    return resToCreate
}