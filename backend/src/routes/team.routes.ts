import {Router} from 'express'
import {getTeams, populateTeamTable} from '../controllers/team.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/', authenticateJWT, getTeams)
router.post('/newSeason', authenticateJWTAdmin, populateTeamTable)

export default router