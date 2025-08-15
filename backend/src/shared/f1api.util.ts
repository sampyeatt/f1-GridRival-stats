import axios from 'axios'

export async function getCurrentRaceResults (meeting_key: number) {
    const response = await axios.get(`https://api.openf1.org/v1/session_result?meeting_key=${meeting_key}`)
    return response.data
}

export async function getCurrentDrivers(seasonId: number) {
    const response = await axios.get(`https://f1api.dev/api/current/drivers?seasonId=${seasonId}`)
    return response.data.drivers
}

export async function getCurrentTeams(seasonId: number) {
    const response = await axios.get(`https://f1api.dev/api/current/teams?seasonId=${seasonId}`)
    return response.data.teams
}

export async function getRaceByRound(seasonId: number, round: number) {
    const response = await axios.get(`https://f1api.dev/api/${seasonId}/${round}`)
    return response.data.race
}

export async function getRaceByMeetingKey(seasonId: number, meeting_key: number) {
    const response = await axios.get(`https://api.openf1.org/v1/sessions?meeting_key=${meeting_key}&year=${seasonId}`)
    return response.data
}

export async function getRacesByYear(seasonId: number) {
    const response = await axios.get(`https://api.openf1.org/v1/meetings?year=${seasonId}`)
    return response.data
}