import {DataTypes, QueryInterface} from 'sequelize'

/**
 * Adds what the scheduler needs: a real race start timestamp to compute
 * checkpoints from, and a run log.
 *
 * `Races.date` is a DATEONLY for display. Deciding when a classification should
 * be available needs the session time too, which the upstream schedule supplies
 * in UTC.
 */
export async function up({context}: {context: QueryInterface}): Promise<void> {
    await context.addColumn('Races', 'startsAt', {
        type: DataTypes.DATE,
        allowNull: true
    })

    await context.createTable('IngestRun', {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false},
        // 'schedule' | 'round' | 'drivers'
        kind: {type: DataTypes.STRING, allowNull: false},
        seasonId: {type: DataTypes.INTEGER, allowNull: false},
        round: {type: DataTypes.INTEGER, allowNull: true},
        /** Which checkpoint triggered this, or 'manual'. */
        trigger: {type: DataTypes.STRING, allowNull: false},
        outcome: {
            type: DataTypes.ENUM('ingested', 'unchanged', 'skipped', 'failed'),
            allowNull: false
        },
        detail: {type: DataTypes.TEXT, allowNull: true},
        classificationChanged: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        durationMs: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        startedAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
        createdAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW}
    })

    await context.addIndex('IngestRun', {
        name: 'ingestrun_lookup_idx',
        fields: ['seasonId', 'round', 'startedAt']
    })
}

export async function down({context}: {context: QueryInterface}): Promise<void> {
    await context.dropTable('IngestRun', {cascade: true}).catch(() => undefined)
    await context.removeColumn('Races', 'startsAt').catch(() => undefined)
}
