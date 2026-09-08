import {SequelizeStorage, Umzug} from 'umzug'
import {connection} from './connection'
import logger from '../shared/logger.util'

import * as baseline from './migrations/000-baseline-users-tokens'
import * as rekey from './migrations/001-rekey-to-season-round'
import * as scheduling from './migrations/002-scheduling'

/**
 * Migrations replace the old `connection.sync()` call.
 *
 * sync() cannot express a composite primary key change and would have silently
 * done nothing to an existing table, which is why the schema had drifted from
 * the models. They are imported statically rather than glob-loaded so that the
 * compiled dist/ build works the same as ts-node.
 */
export const migrator = new Umzug({
    migrations: [
        {name: '000-baseline-users-tokens', ...baseline},
        {name: '001-rekey-to-season-round', ...rekey},
        {name: '002-scheduling', ...scheduling}
    ],
    context: connection.getQueryInterface(),
    storage: new SequelizeStorage({sequelize: connection}),
    logger: {
        info: msg => logger.info(typeof msg === 'string' ? msg : JSON.stringify(msg)),
        warn: msg => logger.warn(typeof msg === 'string' ? msg : JSON.stringify(msg)),
        error: msg => logger.error(typeof msg === 'string' ? msg : JSON.stringify(msg)),
        debug: () => undefined
    }
})

export type Migrator = typeof migrator
