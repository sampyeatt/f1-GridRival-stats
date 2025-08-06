import {Results} from '../models/Results'
import axios from 'axios'


export async function getResutls(seasonId: number) {
    return await Results.findAll({
        where: {
            seasonId: seasonId
        }
    })
}

export async function getCurrentRaceeResults (results: Results[]) {
    const response = await axios.get(`https://f1connectapi.vercel.app/api/current/last/race`)
    return response.data.teams
}