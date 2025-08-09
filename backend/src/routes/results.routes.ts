import {Router} from 'express'
import {addResultArrayToStart, addResultController, getResultsController} from '../controllers/results.controller'

const router = Router()

router.get('/:seasonId{/:round}', getResultsController)
router.post('/', addResultController)
router.post('/start', addResultArrayToStart)

export default router