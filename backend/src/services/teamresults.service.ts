import {TeamResults} from '../models/TeamResults'
import _ from 'lodash'
import {BaseSalaryDriver, BaseSalaryTeam} from '../shared/constants'

export async function getTeamResults(seasonId: number) {
    return await TeamResults.findAll({
        where: {
            seasonId: seasonId
        },
        order: [['cost', 'DESC']],
        include: ['team']
    })
}


export async function getTeamResultsByRound(seasonId: number, round: number) {
    return await TeamResults.findAll({
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
    teamId: string,
    positionDifference: number,
    positionsForMoney: number,
    easeToGainPoints: number,
    rank: number,
    meeting_key: number) {
    const result = new TeamResults()
    result.raceId = raceId
    result.points = points
    result.cost = cost
    result.seasonId = seasonId
    result.round = round
    result.teamId = teamId
    result.positionDifference = positionDifference
    result.positionsForMoney = positionsForMoney
    result.easeToGainPoints = easeToGainPoints
    result.rank = rank
    result.meeting_key = meeting_key
    return TeamResults.build(result).save()
}

export async function bulkAddTeamResults(results: TeamResults[]) {
    return await TeamResults.bulkCreate(results)
}

export async function getTotalSalaryAndPosDiffTeam(teamId: string, seasonId: number, round: number, teamRank: number) {
    const results = await TeamResults.findOne({
        where: {
            teamId: teamId,
            seasonId: seasonId,
            round: round - 1
        }
    })
    if (!results) return{
        totalSalary: 0,
        positionDifference: 0
    }
    const differ = _.round(BaseSalaryTeam[String(teamRank) as keyof typeof BaseSalaryTeam] - results.get('cost')!, 1)

    const posDiff = Math.max(-3, Math.min(3, (Math.sign(differ) * _.floor(( Math.sign(differ) * differ / 4), 1))))

    if(teamId === 'haas') {
        console.log(`----------------------------------------`)
        console.log(`Team: ${teamId}`)
        console.log(`differ: ${differ}`)
        console.log(`posDiff: ${posDiff}`)
        console.log(`results.cost: ${results.get('cost')!}`)
        console.log(`driverRankAndSalary: ${teamRank}`)
        console.log(`BaseSalaryDriver[${teamRank}]: ${BaseSalaryTeam[String(teamRank) as keyof typeof BaseSalaryTeam]}`)
        console.log(`----------------------------------------`)
    }
    return {
        totalSalary: (posDiff + results.get('cost')!),
        positionDifference: posDiff
    }
}

export async function findSalaryBracketTeamResults (salary: number, entries: number[]) {

    const found = _.findIndex(entries, (val, i) => {
        const prevVal = entries[i+1]
        return salary <= val! && salary > prevVal!
    })

    return found+1
}