import {Results} from '../models/Results'
import {Race} from '../models/Race'


export async function getUniqueResutls(seasonId: number) {
    return await Results.findAll({
        attributes: ['raceId'],
        where: {
            seasonId: seasonId
        },
        group: ['raceId']
    })
}

export async function getRaceByCircutKey(circut_key: number) {
    return await Race.findOne({
        where: {
            circut_key: circut_key
        }
    })
}

export async function getSeasonBySeasonId(seasonId: number) {
    return await Race.findAll({
        where: {
            seasonId: seasonId
        },
        order: ['round']
    })
}

export async function getRaceDataByMeetingKey(meeting_key: number) {
    return await Race.findByPk(meeting_key)
}

export async function addSeasonRace(seasonId: number, data: {
    circuit_key: number,
    meeting_name: string,
    circuit_short_name: string,
    country_code: string,
    country_name: string,
    meeting_key: number,
    sprint_key: number,
    quali_key: number,
    race_key: number,
    seasonId: number,
    round: number
}) {
    const race = new Race()
    race.seasonId = seasonId
    race.circut_key = data.circuit_key
    race.meeting_name = data.meeting_name
    race.circuit_short_name = data.circuit_short_name
    race.country_code = data.country_code
    race.country_name = data.country_name
    race.meeting_key = data.meeting_key
    race.sprint_key = data.sprint_key
    race.quali_key = data.quali_key
    race.race_key = data.race_key
    race.seasonId = seasonId
    race.round = data.round
    return await Race.build(race).save()
}