import {Request, Response} from 'express'
import z from 'zod'
import {addUser, getAllById, getUserByEmail, updateToAdmin, updateUser} from '../services/user.service'
import {generateAdminToken, generateToken, verifyToken} from '../shared/auth.util'
import {addToken, deleteTokens, getToken} from '../services/token.service'
import {sendConfirmationEmail, sendForgotPasswordEmail} from '../shared/email.util'
import bcrypt from 'bcrypt'
import {getUsers} from './user.controller'

const passwordZodRules = z.string().min(6).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
})

export const registerController = async (req: Request, res: Response) => {
    const schema = z.object({
        email: z.string().email(),
        password: passwordZodRules
    })

    const parsedData = schema.safeParse(req.body)

    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })

    let {email, password} = req.body

    const existingUser = await getUserByEmail(email)
    if (existingUser) return res.status(400).json({message: 'User already exists'})

    const hash = await bcrypt.hash(password,  10)
    const user = await addUser(email, hash)
    const userId = user.get('userId')
    console.log('user id', userId)
    const token = await generateToken(userId)
    await addToken(token, 'activation', userId)
    const emailSent = await sendConfirmationEmail(email, token)
    if (!emailSent) return res.status(500).json({message: 'Failed to send email'})
    return res.status(201).json({message: 'User registered successfully'})

}

export const loginController = async (req: Request, res: Response) => {
    const schema = z.object({
        email: z.string().email(),
        password: passwordZodRules
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })

    const {email, password} = req.body

    const user = await getUserByEmail(email)
    if (!user) return res.status(400).json({message: 'User Not Found'})
    if (user.get('status') !== 'active') return res.status(400).json({message: 'User is not active, please confirm your email'})
    const match = await bcrypt.compare(password, user.get('password'))
    if (!match) return res.status(400).json({message: 'Invalid credentials'})

    const accessToken = await generateToken(user.get('userId')!)
    const refreshToken = await generateToken(user.get('userId')!, '7d')
    await deleteTokens(user.get('userId')!)
    let adminToken = null
    if (user.get('role') === 'admin') {
        adminToken = await generateAdminToken(user.get('userId')!, password)
        await addToken(adminToken, 'admin', user.get('userId')!)
    }
    await addToken(refreshToken, 'refresh', user.get('userId')!)
    await addToken(accessToken, 'access', user.get('userId')!)

    const session = {
        accessToken,
        refreshToken,
        adminToken,
        user: user.toJSON()
    }

    // @ts-ignore
    delete session.user.password

    return res.status(200).json(session)
}

export const refreshTokenController = async (req: Request, res: Response) => {
    const schema = z.object({
        refreshToken: z.string()
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {refreshToken} = parsedData.data

    const isTokenValid = await verifyToken(refreshToken)
    if (!isTokenValid) return res.status(400).json({message: 'Invalid token or expired'})

    const dbRefreshToken = await getToken(refreshToken)
    if (!dbRefreshToken || dbRefreshToken.get('type') !== 'refresh') return res.status(400).json({message: 'Invalid token'})

    const userId = dbRefreshToken.get('userId')!
    const user = await getAllById(userId)
    const accessToken = await generateToken(userId)
    const newRefreshToken = await generateToken(userId, '7d')

    await deleteTokens(userId)
    if (user && user.get('role') === 'admin') {
        const newAdmin = await generateAdminToken(userId, user.get('password'))
        await addToken(newAdmin, 'admin', userId)
    }

    await addToken(newRefreshToken, 'refresh', userId)
    await addToken(accessToken, 'access', userId)

    return res.status(200).json({accessToken, refreshToken: newRefreshToken})
}

export const logoutController = async (req: Request, res: Response) => {
    const schema = z.object({
        refreshToken: z.string()
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {refreshToken} = parsedData.data

    const isTokenValid = await verifyToken(refreshToken)
    if (!isTokenValid) return res.status(400).json({message: 'Invalid token or expired'})

    const dbRefreshToken = await getToken(refreshToken)
    if (!dbRefreshToken || dbRefreshToken.get('type') !== 'refresh') return res.status(400).json({message: 'Invalid token'})
    const userId = dbRefreshToken.get('userId')!
    await deleteTokens(userId)

    return res.status(200).json({message: 'Logged out successfully'})
}

export const confirmEmailController = async (req: Request, res: Response) => {
    const {token} = req.params

    const isValid = await verifyToken(token!)
    if (!isValid) return res.status(400).json({message: 'Invalid or expired token'})

    const dbToken = await getToken(token!)
    if (!dbToken || dbToken.get('type') !== 'activation') return res.status(400).json({message: 'Invalid token'})

    const userId = dbToken.get('userId')!

    await updateUser({
        id: userId,
        status: 'active'
    })

    await deleteTokens(userId)

    return res.status(200).json({message: 'Email confirmed successfully'})
}

export const forgotPasswordController = async (req: Request, res: Response) => {
    const schema = z.object({
        email: z.string().email(),
        callbackUrl: z.string().url()
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {email, callbackUrl} = parsedData.data

    const user = await getUserByEmail(email)
    if (!user) return res.status(400).json({message: 'User not found'})

    const token = await generateToken(user.get('userId')!)

    await deleteTokens(user.get('userId')!)

    await addToken(token, 'reset', user.get('userId')!)

    await sendForgotPasswordEmail(email, token, callbackUrl)

    return res.status(200).json({message: 'Password reset email sent successfully'})
}

export const resetPasswordController = async (req: Request, res: Response) => {
    const schema = z.object({
        token: z.string(),
        password: passwordZodRules
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {token, password} = parsedData.data
    const isValid = await verifyToken(token)
    if (!isValid) return res.status(400).json({message: 'Invalid or expired token'})
    const dbToken = await getToken(token)
    if (!dbToken || dbToken.get('type') !== 'reset') return res.status(400).json({message: 'Invalid token'})

    const userId = dbToken.get('userId')!
    bcrypt.hash(password, process.env.SALT_ROUNDS ?? 10, async (err, hash) => {
        await updateUser({
            id: userId,
            password: hash
        })
        await deleteTokens(userId)
        return res.status(200).json({message: 'Password reset successfully'})
    })
}

export const getUserRoleController = async (req: Request, res: Response) => {
    if (!req.params.userId) return res.status(400).json({message: 'UserId parameter is required'})
    const {userId} = req.params
    const user = await getAllById(+userId)
    if (!user) return res.status(404).json({message: 'User not found'})
    const role = user.get('role')
    return res.status(200).json({role})
}

export const addUserAdminController = async (req: Request, res: Response) => {
    const schema = z.object({
        email: z.string().email(),
        password: passwordZodRules,
        role: z.enum(['admin', 'user'])
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {email, password} = parsedData.data
    let existingUser = await getUserByEmail(email)
    if (!existingUser) return res.status(400).json({message: 'User does not exist'})
    const match = await bcrypt.compare(password, existingUser.get('password'))
    if (!match) return res.status(400).json({message: 'Invalid credentials'})

    existingUser = existingUser.toJSON()
    // @ts-ignore
    delete existingUser.password

    const token = await generateAdminToken(existingUser.userId!, password)
    await addToken(token, 'admin', existingUser.userId!)
    let adminUser = await updateToAdmin(existingUser.userId!)
    adminUser = adminUser.toJSON()
    // @ts-ignore
    delete adminUser.password

    return res.status(201).json(adminUser)
}

export const validateAdminController = async (req: Request, res: Response) => {
    const schema = z.object({
        token: z.string()
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {token} = parsedData.data
    const validated = await verifyToken(token)
    return res.status(200).json({valid: !!validated})
}

export const validateUserController = async (req: Request, res: Response) => {
    const schema = z.object({
        token: z.string()
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {token} = parsedData.data
    const validated = await verifyToken(token)
    return res.status(200).json({valid: !!validated})
}