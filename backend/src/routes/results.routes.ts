import {Router} from 'express'
import {
    addResultArrayController, addResultBulkController, getDriverResultsToAddController,
    getResultsController, updateResultsController
} from '../controllers/results.controller'

const router = Router()

router.get('/', getResultsController)
// router.get('/:seasonId{/:round}', getResultsByRoundController)
router.get('/drivers', getDriverResultsToAddController)
router.post('/', addResultBulkController)
router.post('/add', addResultArrayController)
router.put('/update', updateResultsController)

export default router