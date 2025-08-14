import {Router} from 'express'
import {
    addResultArrayToStart, addResultBulkController,
    getResultsByRoundController,
    getResultsController, updateResultsController
} from '../controllers/results.controller'

const router = Router()

router.get('/:seasonId', getResultsController)
router.get('/:seasonId{/:round}', getResultsByRoundController)
router.post('/', addResultBulkController)
router.post('/start', addResultArrayToStart)
router.put('/update', updateResultsController)

export default router