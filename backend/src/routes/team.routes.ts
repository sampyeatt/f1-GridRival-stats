import {Router} from 'express'
import {getTeams, populateTeamTable} from '../controllers/team.controller'

const router = Router()

router.get('/', getTeams)
router.post('/newSeason', populateTeamTable)

export default router