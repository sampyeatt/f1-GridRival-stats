import {Router} from 'express'
import {getDrivers, populateDriverTable} from '../controllers/driver.controller'

const router = Router()

router.get('/', getDrivers)
router.post('/newSeason', populateDriverTable)
export default router