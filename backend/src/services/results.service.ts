import {Results} from '../models/Results'


export async function getResutls(seasonId: number) {
    return await Results.findAll({
        where: {
            seasonId: seasonId
        }
    })
}