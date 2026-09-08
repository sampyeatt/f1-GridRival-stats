import {Race} from '../models/Race'

export async function getRacesBySeasonId(seasonId: number) {
    return await Race.findAll({
        where: {seasonId},
        order: [['round', 'ASC']]
    })
}

export async function getRaceByRound(seasonId: number, round: number) {
    return await Race.findOne({where: {seasonId, round}})
}

/** Rounds that have actually been run, newest first. */
export async function getCompletedRaces(seasonId: number) {
    return await Race.findAll({
        where: {seasonId},
        order: [['round', 'DESC']]
    }).then(races => races.filter(r => (r.get('totalLaps') as number) > 0))
}

export async function updateRace(seasonId: number, round: number, data: Partial<Race>) {
    const race = await Race.findOne({where: {seasonId, round}})
    if (!race) return null
    race.set(data)
    return await race.save()
}

export async function deleteRace(seasonId: number, round: number) {
    return await Race.destroy({where: {seasonId, round}})
}
