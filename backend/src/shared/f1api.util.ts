import axios from 'axios'

export async function getCurrentRaceResults (seasonId: number) {
    // const response = await axios.get(`https://f1api.dev/api/current/last/race?seasonId=${seasonId}`)
    const response = await axios.get(`https://f1api.dev/api/${seasonId}/1/race`)
    return response.data
}

export async function getCurrentQualiResults (seasonId: number) {
    // const response = await axios.get(`https://f1api.dev/api/current/last/qualy?seasonId=${seasonId}`)
    const response = await axios.get(`https://f1api.dev/api/${seasonId}/1/qualy`)
    return response.data
}

export async function getCurrentSprintResults (seasonId: number) {
    try {
        const response = await axios.get(`https://f1api.dev/api/current/last/sprint/race?seasonId=${seasonId}`)
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

export async function getCurrentSeason() {
    const response = await axios.get(`https://f1api.dev/api/seasons?limit=1`)
    if(response.data.seasons.length === 0) throw new Error('No seasons found')
    return response.data.championships[0]
}

export async function getRaceByRound(seasonId: number, round: number) {
    const response = await axios.get(`https://f1api.dev/api/${seasonId}/${round}`)
    return response.data.race
}