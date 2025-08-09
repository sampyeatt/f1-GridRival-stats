import axios from 'axios'

export async function getCurrentRaceResults (seasonId: number, round: number) {
    const response = await axios.get(`https://f1api.dev/api/${seasonId}/${round}/race`)
    return response.data
}

export async function getCurrentQualiResults (seasonId: number, round: number) {
    const response = await axios.get(`https://f1api.dev/api/${seasonId}/${round}/qualy`)
    return response.data
}

export async function getCurrentSprintResults (seasonId: number, round: number) {
    try {
        const response = await axios.get(`https://f1api.dev/api/${seasonId}/${round}/sprint/race`)
        return response.data
    } catch (e: any) {
        if (e.response.data.status === 404 && e.response.data.message === 'No sprint race results found for this round. Try with other one.') return null
    }

}

export async function getCurrentDrivers(seasonId: number) {
    const response = await axios.get(`https://f1api.dev/api/current/drivers?seasonId=${seasonId}`)
    return response.data.drivers
}

export async function getCurrentTeams(seasonId: number) {
    const response = await axios.get(`https://f1api.dev/api/current/teams?seasonId=${seasonId}`)
    return response.data.teams
}

export async function getSeasonBySeasonId(seasonId: number) {
    const response = await axios.get(`https://f1api.dev/api/${seasonId}`)
    if(response.data.races.length === 0) throw new Error('No seasons found')
    return response.data.races
}

export async function getRaceByRound(seasonId: number, round: number) {
    const response = await axios.get(`https://f1api.dev/api/${seasonId}/${round}`)
    return response.data.race
}