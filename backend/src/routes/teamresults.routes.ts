import {Router} from 'express'
import {
    addTeamResultBulkController, addTeamResultStartController,
    getTeamResultsByRoundController,
    getTeamResultsController, getTeamResultsToAddController
} from '../controllers/teamresults.controller'

const router = Router()

router.get('/', getTeamResultsController)
router.get('/:seasonId{/:round}', getTeamResultsByRoundController)
router.get('/teams', getTeamResultsToAddController)
router.post('/', addTeamResultBulkController)
router.post('/start', addTeamResultStartController)

export default router