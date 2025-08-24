import {Router} from 'express'
import {
    addRaceBulkController,
    addRaceController, deleteRaceController, getAllRacesController, getRacesByMeetingKeyController,
    getRacesListController, updateCurrentSeason, updateRaceController
} from '../controllers/race.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/list', authenticateJWT, getRacesListController)
router.get('/all', authenticateJWTAdmin, getAllRacesController)
router.get('/bykey/:meeting_key', authenticateJWTAdmin, getRacesByMeetingKeyController)
router.post('/addRace', authenticateJWTAdmin, addRaceController)
router.post('/addRaceBulk', authenticateJWTAdmin, addRaceBulkController)
router.put('/bullkUpdate', authenticateJWTAdmin, updateCurrentSeason)
router.put('/update', authenticateJWTAdmin, updateRaceController)
router.delete('/delete/:meeting_key', authenticateJWTAdmin, deleteRaceController)

export default router