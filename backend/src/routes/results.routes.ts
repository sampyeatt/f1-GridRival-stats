import {Router} from 'express'
import {
    addResultArrayController, addResultBulkController, getDriverResultsToAdd,
    getResultsByRoundController,
    getResultsController, getTeamResultsToAdd, updateResultsController
} from '../controllers/results.controller'

const router = Router()

router.get('/:seasonId', getResultsController)
// router.get('/:seasonId{/:round}', getResultsByRoundController)
router.post('/', addResultBulkController)
router.post('/add', addResultArrayController)
router.put('/update', updateResultsController)
router.get('/drivers', getDriverResultsToAdd)

export default router