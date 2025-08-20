import {Router} from 'express'
import {
    addRaceBulkController,
    addRaceController,
    getRacesBySeasonIdController,
} from '../controllers/race.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/:seasonId', authenticateJWT, getRacesBySeasonIdController)
router.post('/addRace', authenticateJWTAdmin, addRaceController)
router.post('/addRaceBulk', authenticateJWTAdmin, addRaceBulkController)

export default router