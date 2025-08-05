import {Router} from 'express'
import {addUserController, getUsers} from '../controllers/user.controller'

const router = Router()

router.get('/', getUsers)
router.post('/', addUserController)

export default router