import {Router} from 'express'
import {addResultController, getResultsController} from '../controllers/results.controller'

const router = Router()

router.get('/', getResultsController)
router.post('/', addResultController)

export default router