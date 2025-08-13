import {Router} from 'express'
import {addRaceBulkController, addRaceController, getSeasonBySeasonIdController} from '../controllers/race.controller'

const router = Router()

router.get('/:seasonId', getSeasonBySeasonIdController)
router.post('/addRace', addRaceController)
router.post('/addRaceBulk', addRaceBulkController)

export default router