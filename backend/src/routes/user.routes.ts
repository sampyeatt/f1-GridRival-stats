import {Router} from 'express'
import {addUserController, getUsers} from '../controllers/user.controller'
import {authenticateJWT} from '../shared/auth.util'

const router = Router()

router.get('/', getUsers)
router.post('/', authenticateJWT, addUserController)

export default router