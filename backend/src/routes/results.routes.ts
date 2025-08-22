import {Router} from 'express'
import {
    addResultArrayController, addResultBulkController, getDriverResultsToAddController, getResultsByRoundController,
    getResultsController, importRaceDataController, updateResultsController
} from '../controllers/results.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/allResults', authenticateJWT, getResultsController)
router.get('/round/:round', getResultsByRoundController)
router.get('/drivers', authenticateJWTAdmin, getDriverResultsToAddController)
router.post('/bulkadd', authenticateJWTAdmin, addResultBulkController)
router.post('/add', authenticateJWTAdmin, addResultArrayController)
router.put('/update', authenticateJWTAdmin, updateResultsController)
router.post('/bulkImport', authenticateJWTAdmin, importRaceDataController)

export default router