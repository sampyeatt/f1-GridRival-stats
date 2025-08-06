import {Request, Response} from 'express'
import z from 'zod'
import {addUser, getUserByEmail} from '../services/user.service'
import {encryptPassword, generateToken, verifyToken} from '../shared/auth.util'
import {addToken, deleteTokens, getToken} from '../services/token.service'

export const registerController = async (req: Request, res: Response) => {
    const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(6).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
            message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        })
    })

    const parsedData = schema.safeParse(req.body)

    if (!parsedData.success) return res.status(400).json({message: 'Invalid request body', errors: JSON.parse(parsedData.error.message)})

    let {name, email, password} = parsedData.data

    password = await encryptPassword(password)

    const existingUser = await getUserByEmail(email)
    if (existingUser) return res.status(400).json({message: 'User already exists'})

    let user = await addUser(name, email, password)

    user = user.toJSON()
    delete user.password

    // TODO Send Email verification

    return res.status(201).json(user)
}

export const loginController = async (req: Request, res: Response) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6).max(100)
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({message: 'Invalid request body', errors: JSON.parse(parsedData.error.message)})


    const {email, password} = parsedData.data

    const user = await getUserByEmail(email)
    if (!user) return res.status(400).json({message: 'User Not Found'})
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
    if (!parsedData.success) return res.status(400).json({message: 'Invalid request body', errors: JSON.parse(parsedData.error.message)})
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
    if (!parsedData.success) return res.status(400).json({message: 'Invalid request body', errors: JSON.parse(parsedData.error.message)})
    const {refreshToken} = parsedData.data

    const isTokenValid = await verifyToken(refreshToken)
    if (!isTokenValid) return res.status(400).json({message: 'Invalid token or expired'})

    const dbRefreshToken = await getToken(refreshToken)
    if (!dbRefreshToken || dbRefreshToken.get('type') !== 'refresh') return res.status(400).json({message: 'Invalid token'})
    const userId = dbRefreshToken.get('userId')!
    await deleteTokens(userId)

    return res.status(200).json({message: 'Logged out successfully'})
}