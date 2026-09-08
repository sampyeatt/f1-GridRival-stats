import {Router} from 'express'
import {
    deleteRaceController,
    getAllRacesController,
    getRaceByRoundController,
    getRacesListController,
    syncScheduleController,
    updateRaceController
} from '../controllers/race.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/list', authenticateJWT, getRacesListController)
router.get('/all', authenticateJWTAdmin, getAllRacesController)
router.get('/round/:round', authenticateJWTAdmin, getRaceByRoundController)
router.post('/sync', authenticateJWTAdmin, syncScheduleController)
router.put('/update', authenticateJWTAdmin, updateRaceController)
router.delete('/delete/:round', authenticateJWTAdmin, deleteRaceController)

export default router
