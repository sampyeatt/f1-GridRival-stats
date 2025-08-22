import {Router} from 'express'
import {
    addTeamResultBulkController, addTeamResultArrayController,
    getTeamResultsByRoundController,
    getTeamResultsController, getTeamResultsToAddController, importTeamResultsController
} from '../controllers/teamresults.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/teamresults', authenticateJWT, getTeamResultsController)
router.get('/byRound/:round', authenticateJWT, getTeamResultsByRoundController)
router.get('/teams', authenticateJWTAdmin, getTeamResultsToAddController)
router.post('/', authenticateJWTAdmin, addTeamResultBulkController)
router.post('/add', authenticateJWTAdmin, addTeamResultArrayController)
router.post('/bulkimport', authenticateJWTAdmin, importTeamResultsController)

export default router