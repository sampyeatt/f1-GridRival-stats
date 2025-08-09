import {Router} from 'express'
import {getSeasonBySeasonIdController} from '../controllers/season.controller'

const router = Router()

router.get('/:seasonId', getSeasonBySeasonIdController)

export default router