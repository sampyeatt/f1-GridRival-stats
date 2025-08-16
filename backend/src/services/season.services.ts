import {Season} from '../models/Season'

export  async  function getActiveSeason() {
    return await Season.findOne({
        where: {
            currentSeason: true
        }
    })
}

