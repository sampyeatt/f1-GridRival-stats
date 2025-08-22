import {Router} from 'express'
import {
    getAllDriversController,
    getDriversController,
    populateDriverTable
} from '../controllers/driver.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/active', authenticateJWT, getDriversController)
router.get('/all', authenticateJWT, getAllDriversController)
router.post('/newSeason', authenticateJWTAdmin, populateDriverTable)
export default router