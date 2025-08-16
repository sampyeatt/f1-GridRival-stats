import {Router} from 'express'
import {
    addTeamResultBulkController, addTeamResultArrayController,
    getTeamResultsByRoundController,
    getTeamResultsController, getTeamResultsToAddController
} from '../controllers/teamresults.controller'

const router = Router()

router.get('/teamresults', getTeamResultsController)
router.get('/byRound/:seasonId{/:round}', getTeamResultsByRoundController)
router.get('/teams', getTeamResultsToAddController)
router.post('/', addTeamResultBulkController)
router.post('/add', addTeamResultArrayController)

export default router