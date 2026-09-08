import '../database/connection'
import {migrator} from '../database/migrator'
import {connection} from '../database/connection'

/**
 *   npm run migrate          apply all pending migrations
 *   npm run migrate -- down  roll the most recent one back
 */
async function main() {
    const direction = process.argv[2] === 'down' ? 'down' : 'up'
    const applied = direction === 'up' ? await migrator.up() : await migrator.down()

    if (applied.length === 0) console.log('Nothing to do — schema is up to date.')
    else console.log(`${direction}: ${applied.map(m => m.name).join(', ')}`)

    await connection.close()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
