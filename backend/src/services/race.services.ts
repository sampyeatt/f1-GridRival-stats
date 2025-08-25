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

export async function getRacesBySeasonId(seasonId: number) {
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
    sprint_key: number | undefined ,
    quali_key: number | undefined,
    race_key: number | undefined,
    seasonId: number,
    round: number,
    totalLaps: number,
    raceId: string
}) {
    const race = new Race()
    race.set({
        seasonId: seasonId,
        circut_key: data.circuit_key,
        meeting_name: data.meeting_name,
        circuit_short_name: data.circuit_short_name,
        country_code: data.country_code,
        country_name: data.country_name,
        meeting_key: data.meeting_key,
        round: data.round,
        totalLaps: data.totalLaps,
        raceId: data.raceId
    })
    if (data.sprint_key) race.set({sprint_key: data.sprint_key})
    if (data.quali_key) race.set({quali_key: data.quali_key})
    if (data.race_key) race.set({race_key: data.race_key})
    console.log('race', race)
    return await race.save()
}

export async function updateRaceBulk(raceData: Race[]){
    return raceData.map(async (race: Race) => {
        const raceInstance = await Race.findByPk(race.meeting_key)
        if (!raceInstance) return
        raceInstance.set(race)
        return await raceInstance.save()
    })
}

export async function deleteRace(meeting_key: number) {
    return await Race.destroy({where: {meeting_key: meeting_key}})
}