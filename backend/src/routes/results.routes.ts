import {Router} from 'express'
import {getResults} from '../controllers/results.controller'

const router = Router()

router.get('/', getResults)

export default router