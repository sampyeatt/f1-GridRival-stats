import {Season} from '../models/Season'

export  async  function getActiveSeason() {
    return await Season.findOne({
        where: {
            currentSeason: true
        }
    })
}

export  async  function getAllSeasons() {
    return await Season.findAll()
}

export  async  function upsertSeason(season: Partial<Season>) {
    let seasonInstance = await Season.findByPk(season.seasonId) || new Season()
    seasonInstance.set(season)
    return seasonInstance.save()
}

export  async  function deleteSeason(seasonId: number) {
    return await Season.destroy({where: {seasonId: seasonId}})
}

