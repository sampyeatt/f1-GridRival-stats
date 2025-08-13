import {Router} from 'express'
import {
    addResultArrayToStart, addResultBulkController,
    getResultsByRoundController,
    getResultsController
} from '../controllers/results.controller'

const router = Router()

router.get('/:seasonId', getResultsController)
router.get('/:seasonId{/:round}', getResultsByRoundController)
router.post('/', addResultBulkController)
router.post('/start', addResultArrayToStart)

export default router