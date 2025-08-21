import {Router} from 'express'
import {
    addRaceBulkController,
    addRaceController,
    getRacesBySeasonIdController, updateCurrentSeason
} from '../controllers/race.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/:seasonId', authenticateJWT, getRacesBySeasonIdController)
router.post('/addRace', authenticateJWTAdmin, addRaceController)
router.post('/addRaceBulk', authenticateJWTAdmin, addRaceBulkController)
router.put('/updateRaces', authenticateJWTAdmin, updateCurrentSeason)

export default router