import dotenv from 'dotenv'

dotenv.config({
    path: './src/.env'
})

import jwt from 'jsonwebtoken'
import {Request, Response} from 'express'
import {User} from '../models/User'

const secretKey = process.env.JWT_SECRET!


export async function generateToken(userId: number, expiresIn = '1h'): Promise<string> {
    const payload = {
        userId: userId
    }
    return jwt.sign(payload, secretKey, {expiresIn: expiresIn as any})
}

export async function generateAdminToken(userId: number, password: string, expiresIn = '1h'): Promise<string> {
    const payload = {
        userId: userId,
        role: 'admin',
        status: 'active',
        password: password
    }
    return jwt.sign(payload, secretKey, {expiresIn: expiresIn as any})
}

export async function encryptPassword(password: string): Promise<string> {
    return jwt.sign(password, secretKey)
}

export async function verifyToken(token: string) {
    try {
        return jwt.verify(token, secretKey)
    } catch (error) {
        return null
    }
}

export async function authenticateJWT(req: Request, res: Response, next: Function) {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
        return res.status(401).json({message: 'Unauthorized'})
    }
    const verified = await verifyToken(token)
    if (!verified) {
        return res.status(401).json({message: 'Invalid token'})
    }

    User.findByPk((verified as any).userId).then(user => {
        if (user) {
            (req as any).user = user
        } else {
            return res.status(401).json({message: 'User not found'})
        }
        next()
    })
}

export async function authenticateJWTAdmin(req: Request, res: Response, next: Function) {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
        return res.status(401).json({message: 'Unauthorized'})
    }
    const verified = await verifyToken(token)
    if (!verified) {
        return res.status(401).json({message: 'Invalid token'})
    }

    User.findByPk((verified as any).userId).then(user => {
        if (user) {
            (req as any).user = user
        } else {
            return res.status(401).json({message: 'User not found'})
        }
        next()
    })
}