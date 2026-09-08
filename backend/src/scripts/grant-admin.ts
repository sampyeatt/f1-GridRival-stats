/**
 * Promotes an existing, email-confirmed account to admin.
 *
 *   npx ts-node src/scripts/grant-admin.ts you@example.com
 *
 * PUT /api/auth/addUserAdmin is admin-only, so the first admin has to be made
 * out of band. That is the point: it used to be an endpoint any registered user
 * could call on themselves.
 */
import '../database/index'
import {getUserByEmail} from '../services/user.service'
import {updateToAdmin} from '../services/user.service'
import {connection} from '../database/connection'

async function main() {
    const email = process.argv[2]
    if (!email) {
        console.error('usage: grant-admin.ts <email>')
        process.exit(1)
    }

    const user = await getUserByEmail(email)
    if (!user) {
        console.error(`No account for ${email}`)
        process.exit(1)
    }
    if (user.get('status') !== 'active') {
        console.error(`${email} has not confirmed their email yet`)
        process.exit(1)
    }

    await updateToAdmin(user.get('userId')!)
    console.log(`${email} is now an admin. They will receive an admin token on next login.`)
    await connection.close()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
