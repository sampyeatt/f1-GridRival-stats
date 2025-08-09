import {Router} from 'express'
import {
    addResultArrayToStart,
    addResultController,
    getResultsByRoundController,
    getResultsController
} from '../controllers/results.controller'

const router = Router()

router.get('/:seasonId', getResultsController)
router.get('/:seasonId{/:round}', getResultsByRoundController)
router.post('/', addResultController)
router.post('/start', addResultArrayToStart)

export default router