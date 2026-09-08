import {Router} from 'express'
import {
    getResultsByRoundController,
    getResultsController,
    ingestAndScoreRoundController,
    rescoreRoundController
} from '../controllers/results.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/allResults', authenticateJWT, getResultsController)
router.get('/round/:round', authenticateJWT, getResultsByRoundController)
router.post('/ingest', authenticateJWTAdmin, ingestAndScoreRoundController)
router.post('/rescore/:round', authenticateJWTAdmin, rescoreRoundController)

export default router
