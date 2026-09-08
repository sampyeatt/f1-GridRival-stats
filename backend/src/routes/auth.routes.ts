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
import rateLimit from 'express-rate-limit'

// Credential endpoints are the ones worth throttling: they are unauthenticated,
// they reveal whether an account exists, and they each cost a bcrypt round.
const credentialLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {message: 'Too many attempts, please try again later'}
})

const router = Router()

router.get('/confirm-email/:token', confirmEmailController)
router.get('/role/:userId', authenticateJWT, getUserRoleController)
router.post('/login', credentialLimiter, loginController)
router.post('/register', credentialLimiter, registerController)
router.post('/logout', logoutController)
router.post('/refresh', refreshTokenController)
router.post('/forgot-password', credentialLimiter, forgotPasswordController)
router.post('/reset-password', credentialLimiter, resetPasswordController)
router.post('/validateAdmin',authenticateJWTAdmin, validateAdminController)
router.post('/validateUser',authenticateJWT, validateUserController)
router.put('/addUserAdmin', authenticateJWTAdmin, addUserAdminController)

export default router