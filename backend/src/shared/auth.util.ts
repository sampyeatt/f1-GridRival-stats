import dotenv from 'dotenv'

dotenv.config({
    path: './src/.env'
})

import jwt from 'jsonwebtoken'
import {NextFunction, Request, Response} from 'express'
import {User} from '../models/User'
import {getToken} from '../services/token.service'

const configuredSecret = process.env.JWT_SECRET
if (!configuredSecret) {
    throw new Error('JWT_SECRET is not set — refusing to start with an unsigned token scheme')
}
const secretKey: string = configuredSecret

export interface TokenClaims {
    userId: number
    role?: 'admin'
}

export async function generateToken(userId: number, expiresIn = '1h'): Promise<string> {
    return jwt.sign({userId}, secretKey, {expiresIn: expiresIn as any})
}

/**
 * The admin token carries only the role claim. It deliberately does NOT carry
 * the password — a JWT payload is base64, not encryption, and this token is
 * both persisted to the Tokens table and stored in the browser.
 */
export async function generateAdminToken(userId: number, expiresIn = '1h'): Promise<string> {
    return jwt.sign({userId, role: 'admin'}, secretKey, {expiresIn: expiresIn as any})
}

export async function verifyToken(token: string): Promise<TokenClaims | null> {
    try {
        return jwt.verify(token, secretKey) as TokenClaims
    } catch {
        return null
    }
}

/**
 * Resolves a bearer token to its user, or null. A token is only accepted if it
 * still has a row in the Tokens table, so logout actually revokes rather than
 * leaving the token live until it expires.
 */
async function resolveUser(token: string | undefined): Promise<User | null> {
    if (!token) return null
    const claims = await verifyToken(token)
    if (!claims) return null

    const stored = await getToken(token)
    if (!stored) return null

    return User.findByPk(claims.userId)
}

function bearer(req: Request, header: string): string | undefined {
    return req.header(header)?.replace('Bearer ', '')
}

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await resolveUser(bearer(req, 'Authorization'))
        if (!user) return res.status(401).json({message: 'Unauthorized'})

        ;(req as any).user = user
        next()
    } catch (error) {
        next(error)
    }
}

export async function authenticateJWTAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await resolveUser(bearer(req, 'Authorization'))
        if (!user) return res.status(401).json({message: 'Unauthorized'})

        const adminToken = bearer(req, 'AdminAuth')
        if (!adminToken) return res.status(403).json({message: 'Forbidden'})

        const adminClaims = await verifyToken(adminToken)

        // All three checks matter. The role claim stops an ordinary access
        // token being replayed in the AdminAuth header; the userId match stops
        // one user pairing their own access token with someone else's admin
        // token; and the live DB role means a demotion takes effect at once
        // instead of at token expiry.
        if (!adminClaims || adminClaims.role !== 'admin') {
            return res.status(403).json({message: 'Forbidden'})
        }
        if (adminClaims.userId !== user.get('userId')) {
            return res.status(403).json({message: 'Forbidden'})
        }
        if (user.get('role') !== 'admin') {
            return res.status(403).json({message: 'Forbidden'})
        }
        if (!(await getToken(adminToken))) {
            return res.status(403).json({message: 'Forbidden'})
        }

        ;(req as any).user = user
        next()
    } catch (error) {
        next(error)
    }
}
