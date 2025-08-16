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

router.get('/confirm-email/:token', confirmEmailController)
router.get('/role/:userId', authenticateJWT, getUserRoleController)
router.post('/login', loginController)
router.post('/register', registerController)
router.post('/logout', logoutController)
router.post('/refresh', refreshTokenController)
router.post('/forgot-password', forgotPasswordController)
router.post('/reset-password', resetPasswordController)

export default router