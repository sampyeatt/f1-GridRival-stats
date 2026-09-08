import {beforeEach, describe, expect, it, vi} from 'vitest'

// The middleware resolves the caller through these two, so they are the seam.
vi.mock('../src/services/token.service', () => ({
    getToken: vi.fn(),
    addToken: vi.fn(),
    deleteTokens: vi.fn()
}))
vi.mock('../src/models/User', () => ({
    User: {findByPk: vi.fn()}
}))

import jwt from 'jsonwebtoken'
import {authenticateJWTAdmin, generateAdminToken, generateToken} from '../src/shared/auth.util'
import {getToken} from '../src/services/token.service'
import {User} from '../src/models/User'

type Role = 'admin' | 'user'

const fakeUser = (userId: number, role: Role) => ({
    get: (field: string) => (field === 'userId' ? userId : field === 'role' ? role : undefined)
})

function reqWith(headers: Record<string, string>) {
    return {header: (name: string) => headers[name]} as any
}

function resSpy() {
    const res: any = {statusCode: 0, body: undefined}
    res.status = (code: number) => { res.statusCode = code; return res }
    res.json = (body: unknown) => { res.body = body; return res }
    return res
}

beforeEach(() => {
    vi.mocked(getToken).mockReset()
    vi.mocked(User.findByPk).mockReset()
})

describe('S4 — the admin token carries no password', () => {
    it('contains only userId and the role claim', async () => {
        const token = await generateAdminToken(7)
        const payload = jwt.decode(token) as Record<string, unknown>

        expect(payload.userId).toBe(7)
        expect(payload.role).toBe('admin')
        expect(payload).not.toHaveProperty('password')
        // A JWT payload is base64, so this is the check that matters: nothing
        // password-shaped should survive a raw decode of the token.
        expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'role', 'userId'])
    })
})

describe('S3 — authenticateJWTAdmin actually checks the role', () => {

    it('rejects an ordinary access token replayed in the AdminAuth header', async () => {
        // This was the whole exploit: the old middleware only verified that
        // both headers were validly signed, never that either claimed admin.
        const accessToken = await generateToken(1)
        vi.mocked(getToken).mockResolvedValue({} as any)
        vi.mocked(User.findByPk).mockResolvedValue(fakeUser(1, 'admin') as any)

        const res = resSpy()
        const next = vi.fn()
        await authenticateJWTAdmin(
            reqWith({Authorization: `Bearer ${accessToken}`, AdminAuth: `Bearer ${accessToken}`}),
            res,
            next
        )

        expect(next).not.toHaveBeenCalled()
        expect(res.statusCode).toBe(403)
    })

    it('rejects an admin token minted for a different user', async () => {
        const accessToken = await generateToken(1)
        const someoneElsesAdmin = await generateAdminToken(2)
        vi.mocked(getToken).mockResolvedValue({} as any)
        vi.mocked(User.findByPk).mockResolvedValue(fakeUser(1, 'admin') as any)

        const res = resSpy()
        const next = vi.fn()
        await authenticateJWTAdmin(
            reqWith({Authorization: `Bearer ${accessToken}`, AdminAuth: `Bearer ${someoneElsesAdmin}`}),
            res,
            next
        )

        expect(next).not.toHaveBeenCalled()
        expect(res.statusCode).toBe(403)
    })

    it('rejects a valid admin token when the DB says the user is no longer an admin', async () => {
        const accessToken = await generateToken(1)
        const adminToken = await generateAdminToken(1)
        vi.mocked(getToken).mockResolvedValue({} as any)
        vi.mocked(User.findByPk).mockResolvedValue(fakeUser(1, 'user') as any)

        const res = resSpy()
        const next = vi.fn()
        await authenticateJWTAdmin(
            reqWith({Authorization: `Bearer ${accessToken}`, AdminAuth: `Bearer ${adminToken}`}),
            res,
            next
        )

        expect(next).not.toHaveBeenCalled()
        expect(res.statusCode).toBe(403)
    })

    it('admits a genuine admin', async () => {
        const accessToken = await generateToken(1)
        const adminToken = await generateAdminToken(1)
        vi.mocked(getToken).mockResolvedValue({} as any)
        vi.mocked(User.findByPk).mockResolvedValue(fakeUser(1, 'admin') as any)

        const res = resSpy()
        const next = vi.fn()
        await authenticateJWTAdmin(
            reqWith({Authorization: `Bearer ${accessToken}`, AdminAuth: `Bearer ${adminToken}`}),
            res,
            next
        )

        expect(next).toHaveBeenCalledOnce()
        expect(res.statusCode).toBe(0)
    })
})

describe('S5 — a revoked token stops working', () => {
    it('rejects a signed token that no longer has a row in Tokens', async () => {
        const accessToken = await generateToken(1)
        const adminToken = await generateAdminToken(1)
        // Logout deleted the rows; the signature is still valid.
        vi.mocked(getToken).mockResolvedValue(null as any)
        vi.mocked(User.findByPk).mockResolvedValue(fakeUser(1, 'admin') as any)

        const res = resSpy()
        const next = vi.fn()
        await authenticateJWTAdmin(
            reqWith({Authorization: `Bearer ${accessToken}`, AdminAuth: `Bearer ${adminToken}`}),
            res,
            next
        )

        expect(next).not.toHaveBeenCalled()
        expect(res.statusCode).toBe(401)
    })
})
