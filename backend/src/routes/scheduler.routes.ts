import {Router} from 'express'
import {
    ingestRunsController,
    refreshSeasonController,
    runRoundController,
    runSyncController,
    runTickController,
    schedulerStatusController
} from '../controllers/scheduler.controller'
import {authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/status', authenticateJWTAdmin, schedulerStatusController)
router.get('/runs', authenticateJWTAdmin, ingestRunsController)
router.post('/tick', authenticateJWTAdmin, runTickController)
router.post('/sync', authenticateJWTAdmin, runSyncController)
router.post('/season', authenticateJWTAdmin, refreshSeasonController)
router.post('/round/:round', authenticateJWTAdmin, runRoundController)

export default router
