import {connection} from './connection'

/**
 * Schema changes are applied by migrations, not by sync() — see migrator.ts.
 * Run them with `npm run migrate` (the container does this before starting).
 */
export {connection}
