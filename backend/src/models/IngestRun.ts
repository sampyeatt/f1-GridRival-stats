import {AutoIncrement, Column, DataType, Model, PrimaryKey, Table} from 'sequelize-typescript'

export type IngestOutcome = 'ingested' | 'unchanged' | 'skipped' | 'failed'

/**
 * One row per scheduled or manual ingest attempt.
 *
 * When a Sunday-night ingest quietly does nothing, this is the only thing that
 * will say why — the previous design had no record that a run had even
 * happened, because there were no runs, only button presses.
 */
@Table({tableName: 'IngestRun', updatedAt: false})
export class IngestRun extends Model<IngestRun> {

    @PrimaryKey
    @AutoIncrement
    @Column({allowNull: false})
    declare id: number

    /** 'schedule' | 'round' | 'drivers' | 'season' */
    @Column({allowNull: false})
    declare kind: string

    @Column({allowNull: false})
    declare seasonId: number

    @Column({allowNull: true, type: DataType.INTEGER})
    declare round: number | null

    /** Which checkpoint triggered this, or 'manual'. */
    @Column({allowNull: false})
    declare trigger: string

    @Column({
        allowNull: false,
        type: DataType.ENUM('ingested', 'unchanged', 'skipped', 'failed')
    })
    declare outcome: IngestOutcome

    @Column({allowNull: true, type: DataType.TEXT})
    declare detail: string | null

    /** Named to avoid colliding with Sequelize's built-in Model.changed(). */
    @Column({allowNull: false, defaultValue: false})
    declare classificationChanged: boolean

    @Column({allowNull: false, defaultValue: 0})
    declare durationMs: number

    @Column({allowNull: false, type: DataType.DATE, defaultValue: DataType.NOW})
    declare startedAt: Date
}
