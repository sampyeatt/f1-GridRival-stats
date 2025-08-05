import {Results} from '../models/Results'


export async function getResutls(seasonId: number) {
    const results = await Results.findAll({
        where: {
            seasonId: seasonId
        }
    })
    return results
}