import {Router} from 'express'
import {getUsers} from '../controllers/user.controller'
import {authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/', authenticateJWTAdmin, getUsers)

export default router
