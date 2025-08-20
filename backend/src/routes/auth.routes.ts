import {Router} from 'express'
import {
    addUserAdminController,
    confirmEmailController, forgotPasswordController, getUserRoleController,
    loginController,
    logoutController,
    refreshTokenController,
    registerController, resetPasswordController, validateAdminController, validateUserController
} from '../controllers/auth.controller'
import {authenticateJWT, authenticateJWTAdmin} from '../shared/auth.util'

const router = Router()

router.get('/confirm-email/:token', confirmEmailController)
router.get('/role/:userId', authenticateJWT, getUserRoleController)
router.post('/login', loginController)
router.post('/register', registerController)
router.post('/logout', logoutController)
router.post('/refresh', refreshTokenController)
router.post('/forgot-password', forgotPasswordController)
router.post('/reset-password', resetPasswordController)
router.post('/validateAdmin',authenticateJWTAdmin, validateAdminController)
router.post('/validateUser',authenticateJWT, validateUserController)
router.put('/addUserAdmin', authenticateJWTAdmin, addUserAdminController)

export default router