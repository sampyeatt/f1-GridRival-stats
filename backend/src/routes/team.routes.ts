import {Router} from 'express'
import {getTeams, populateTeamTable} from '../controllers/team.controller'
import {authenticateJWT} from '../shared/auth.util'

const router = Router()

router.get('/', getTeams)
router.post('/newSeason', populateTeamTable)

export default router