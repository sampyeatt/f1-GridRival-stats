import {Router} from 'express'
import {
    addResultArrayController, addResultBulkController, getDriverResultsToAddController,
    getResultsController, updateResultsController
} from '../controllers/results.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/allResults', authenticateJWT, getResultsController)
// router.get('/:round', getResultsByRoundController)
router.get('/drivers', authenticateJWTAdmin, getDriverResultsToAddController)
router.post('/', authenticateJWTAdmin, addResultBulkController)
router.post('/add', authenticateJWTAdmin, addResultArrayController)
router.put('/update', authenticateJWTAdmin, updateResultsController)

export default router