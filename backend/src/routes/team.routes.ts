import {Router} from 'express'
import {deleteTeamController, getTeams, populateTeamTable, updateTeamController} from '../controllers/team.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/', authenticateJWT, getTeams)
router.post('/newSeason', authenticateJWTAdmin, populateTeamTable)
router.post('/update', authenticateJWTAdmin, updateTeamController)
router.delete('/delete/:teamId', authenticateJWTAdmin, deleteTeamController)

export default router