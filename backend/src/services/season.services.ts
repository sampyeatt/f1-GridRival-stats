import {Results} from '../models/Results'

export async function getUniqueResutls(seasonId: number) {
    return await Results.findAll({
        attributes: ['raceId'],
        where: {
            seasonId: seasonId
        },
        group: ['raceId']
    })
}