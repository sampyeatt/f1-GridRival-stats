import {Router} from 'express'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'
import {
    addSeasonController,
    deleteSeasonController,
    getActiveSeasonController,
    getAllSeasonsController, inactivateSeasonController
} from '../controllers/season.controller'

const router = Router()

router.get('/active', authenticateJWT, getActiveSeasonController)
router.get('/all', authenticateJWT, getAllSeasonsController)
router.post('/add', authenticateJWTAdmin, addSeasonController)
router.delete('/delete', authenticateJWTAdmin, deleteSeasonController)
router.put('/inactivate', authenticateJWTAdmin, inactivateSeasonController)

export default router