import {Router} from 'express'
import {deleteTeamController, getTeams, updateTeamController} from '../controllers/team.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/', authenticateJWT, getTeams)
router.put('/update', authenticateJWTAdmin, updateTeamController)
router.delete('/delete/:teamId', authenticateJWTAdmin, deleteTeamController)

export default router
