import {Request, Response} from 'express'
import z from 'zod'
import {addUser, getUserByEmail, updateUser} from '../services/user.service'
import {encryptPassword, generateToken, verifyToken} from '../shared/auth.util'
import {addToken, deleteTokens, getToken} from '../services/token.service'
import {sendConfirmationEmail, sendForgotPasswordEmail} from '../shared/email.util'

const passwordZodRules = z.string().min(6).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
})

export const registerController = async (req: Request, res: Response) => {
    const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: passwordZodRules
    })

    const parsedData = schema.safeParse(req.body)

    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })

    let {name, email, password} = parsedData.data

    password = await encryptPassword(password)

    const existingUser = await getUserByEmail(email)
    if (existingUser) return res.status(400).json({message: 'User already exists'})

    let user = await addUser(name, email, password)

    user = user.toJSON()
    delete user.password

    const token = await generateToken(user.userId!)
    await addToken(token, 'activation', user.userId!)
    await sendConfirmationEmail(email, token)

    return res.status(201).json(user)
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


    const {email, password} = parsedData.data

    const user = await getUserByEmail(email)
    if (!user) return res.status(400).json({message: 'User Not Found'})
    if (user.get('status') !== 'active') return res.status(400).json({message: 'User is not active, please confirm your email'})
    const dbPassword = await verifyToken(user.get('password')!)
    if (dbPassword !== password) return res.status(400).json({message: 'Invalid credentials'})

    const accessToken = await generateToken(user.get('userId')!)
    const refreshToken = await generateToken(user.get('userId')!, '7d')

    await deleteTokens(user.get('userId')!)

    await addToken(refreshToken, 'refresh', user.get('userId')!)
    await addToken(accessToken, 'access', user.get('userId')!)

    const session = {
        accessToken,
        refreshToken,
        user: user.toJSON()
    }

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
    const accessToken = await generateToken(userId)
    const newRefreshToken = await generateToken(userId, '7d')
    await deleteTokens(userId)


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

    const encryptedPassword = await encryptPassword(password)

    await updateUser({
        id: userId,
        password: encryptedPassword
    })

    await deleteTokens(userId)

    return res.status(200).json({message: 'Password reset successfully'})
}