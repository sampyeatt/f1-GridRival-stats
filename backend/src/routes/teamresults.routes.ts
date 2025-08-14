import {Router} from 'express'
import {
    addTeamResultBulkController, addTeamResultStartController,
    getTeamResultsByRoundController,
    getTeamResultsController
} from '../controllers/teamresults.controller'

const router = Router()

router.get('/:seasonId', getTeamResultsController)
router.get('/:seasonId{/:round}', getTeamResultsByRoundController)
router.post('/', addTeamResultBulkController)
router.post('/start', addTeamResultStartController)

export default router