import {Router} from 'express'
import {
    confirmEmailController, forgotPasswordController, getUserRoleController,
    loginController,
    logoutController,
    refreshTokenController,
    registerController, resetPasswordController
} from '../controllers/auth.controller'
import {authenticateJWT} from '../shared/auth.util'

const router = Router()


router.post('/register', registerController)
router.post('/login', loginController)
router.post('/refresh', refreshTokenController)
router.post('/logout', logoutController)
router.get('/confirm-email/:token', confirmEmailController)
router.post('/forgot-password', forgotPasswordController)
router.post('/reset-password', resetPasswordController)
router.get('/role/:userId', authenticateJWT, getUserRoleController)

export default router