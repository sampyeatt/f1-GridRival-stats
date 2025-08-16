import {Router} from 'express'
import {
    addRaceBulkController,
    addRaceController,
    getRacesBySeasonIdController,
} from '../controllers/race.controller'

const router = Router()

router.get('/:seasonId', getRacesBySeasonIdController)
router.post('/addRace', addRaceController)
router.post('/addRaceBulk', addRaceBulkController)

export default router