import {Router} from 'express'
import {
    addResultArrayController, addResultBulkController, getDriverResultsToAdd,
    getResultsController, updateResultsController
} from '../controllers/results.controller'

const router = Router()

router.get('/', getResultsController)
// router.get('/:seasonId{/:round}', getResultsByRoundController)
router.post('/', addResultBulkController)
router.post('/add', addResultArrayController)
router.put('/update', updateResultsController)
router.get('/drivers', getDriverResultsToAdd)

export default router