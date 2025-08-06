import {Router} from 'express'
import {getDrivers, populateDriverTable} from '../controllers/driver.controller'
import {authenticateJWT} from '../shared/auth.util'

const router = Router()

router.get('/', getDrivers)
router.post('/newSeason', authenticateJWT, populateDriverTable)
export default router