import {Router} from 'express'
import {
    addResultArrayToStart, addResultBulkController, getDriverResultsToAdd,
    getResultsByRoundController,
    getResultsController, updateResultsController
} from '../controllers/results.controller'

const router = Router()

// router.get('/:seasonId', getResultsController)
// router.get('/:seasonId{/:round}', getResultsByRoundController)
router.post('/', addResultBulkController)
router.post('/start', addResultArrayToStart)
router.put('/update', updateResultsController)
router.get('/:seasonId', getDriverResultsToAdd)

export default router