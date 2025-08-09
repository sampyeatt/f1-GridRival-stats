import {Router} from 'express'
import {getSeasonBySeasonIdController} from '../services/season.services'

const router = Router()

router.get('/:seasonId', getSeasonBySeasonIdController)

export default router