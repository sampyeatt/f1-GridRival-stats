import {Season} from '../models/Season'
import {connection} from '../database/connection'

/**
 * The current season, which every screen reads: the dashboard, the race list,
 * the driver list and the scheduler all resolve "now" through this.
 *
 * Ordered rather than left to the table's natural order, so a database that
 * already has two seasons flagged current — which was possible before
 * upsertSeason enforced the invariant below — resolves to the newer one
 * instead of to whichever row Postgres happened to return first.
 */
export async function getActiveSeason() {
    return await Season.findOne({
        where: {
            currentSeason: true
        },
        order: [['seasonId', 'DESC']]
    })
}

export  async  function getAllSeasons() {
    return await Season.findAll()
}

/**
 * Creates or updates a season, keeping "exactly one is current" true.
 *
 * Marking a season current used to leave the previous one flagged as well, so
 * adding 2026 did not actually move the app off 2025 — getActiveSeason would
 * return either. Every ingest and every screen keys off that one flag, so the
 * new season could be created and still be invisible.
 */
export async function upsertSeason(season: Partial<Season>) {
    return await connection.transaction(async transaction => {
        if (season.currentSeason) {
            await Season.update({currentSeason: false} as any, {
                where: {currentSeason: true},
                transaction
            })
        }

        const seasonInstance = await Season.findByPk(season.seasonId, {transaction}) || new Season()
        seasonInstance.set(season)
        return await seasonInstance.save({transaction})
    })
}

export  async  function deleteSeason(seasonId: number) {
    return await Season.destroy({where: {seasonId: seasonId}})
}
