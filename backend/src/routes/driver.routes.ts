import {Router} from 'express'
import {getDrivers, populateDriverTable} from '../controllers/driver.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/', authenticateJWT, getDrivers)
router.post('/newSeason', authenticateJWTAdmin, populateDriverTable)
export default router