import {Router} from 'express'
import {
    getTeamResultsByRoundController,
    getTeamResultsController
} from '../controllers/teamresults.controller'
import {authenticateJWT} from '../shared/auth.util'

const router = Router()

router.get('/teamresults', authenticateJWT, getTeamResultsController)
router.get('/byRound/:round', authenticateJWT, getTeamResultsByRoundController)

export default router
