import {describe, expect, it} from 'vitest'
import {connection} from '../src/database/connection'
import {migrator} from '../src/database/migrator'

/**
 * Guards the wiring that has no other safety net: Sequelize does not connect
 * until a query runs, so a model that is not registered or a migration that is
 * not imported fails at runtime rather than at build time.
 */
describe('schema wiring', () => {

    it('registers every model on the connection', () => {
        // SequelizeMeta is Umzug's migration bookkeeping, not a domain model.
        const registered = Object.keys(connection.models)
            .filter(name => name !== 'SequelizeMeta')
            .sort()
        expect(registered).toEqual([
            'Driver', 'IngestRun', 'Race', 'RawIngest', 'Results', 'Season',
            'Team', 'TeamResults', 'Token', 'User'
        ])
    })

    it('keys Results on (seasonId, round, driverId)', () => {
        // The composite primary key is what makes ingest idempotent — if this
        // ever reverts to a surrogate id, duplicate rows come back.
        const attrs = connection.models.Results!.getAttributes() as Record<string, any>
        const pk = Object.entries(attrs)
            .filter(([, a]) => a.primaryKey)
            .map(([name]) => name)
            .sort()
        expect(pk).toEqual(['driverId', 'round', 'seasonId'])
    })

    it('keys TeamResults on (seasonId, round, teamId)', () => {
        const attrs = connection.models.TeamResults!.getAttributes() as Record<string, any>
        const pk = Object.entries(attrs)
            .filter(([, a]) => a.primaryKey)
            .map(([name]) => name)
            .sort()
        expect(pk).toEqual(['round', 'seasonId', 'teamId'])
    })

    it('keys Races on (seasonId, round)', () => {
        const attrs = connection.models.Race!.getAttributes() as Record<string, any>
        const pk = Object.entries(attrs)
            .filter(([, a]) => a.primaryKey)
            .map(([name]) => name)
            .sort()
        expect(pk).toEqual(['round', 'seasonId'])
    })

    it('does not put a unique constraint on driverNumber', () => {
        // Jolpica reports the same permanentNumber for more than one driver;
        // the old unique constraint made the import impossible.
        const attrs = connection.models.Driver!.getAttributes() as Record<string, any>
        expect(attrs.driverNumber?.unique).toBeFalsy()
    })

    it('has every migration, in order', async () => {
        const pending = await migrator.migrations({} as any)
        expect(pending.map(m => m.name)).toEqual([
            '000-baseline-users-tokens',
            '001-rekey-to-season-round',
            '002-scheduling'
        ])
    })

    it('does not name a column after a Sequelize method', () => {
        // `changed` would have shadowed Model.changed(); the collision only
        // surfaces at model-registration time, i.e. at boot.
        const reserved = ['changed', 'previous', 'save', 'destroy', 'reload', 'validate']
        for (const [name, model] of Object.entries(connection.models)) {
            for (const attr of Object.keys(model.getAttributes())) {
                expect(reserved, `${name}.${attr}`).not.toContain(attr)
            }
        }
    })
})
