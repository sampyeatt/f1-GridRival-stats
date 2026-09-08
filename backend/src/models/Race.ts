import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table} from 'sequelize-typescript'
import {Results} from './Results'
import {Season} from './Season'

/**
 * Keyed by (seasonId, round) — the identity Jolpica uses.
 *
 * The previous schema keyed on OpenF1's meeting_key and derived `round` from an
 * array index over a list that still contained pre-season testing, which was
 * correct only by accident.
 */
@Table({tableName: 'Races'})
export class Race extends Model<Race> {

    @PrimaryKey
    @ForeignKey(() => Season)
    @Column({allowNull: false})
    declare seasonId: number

    @PrimaryKey
    @Column({allowNull: false})
    declare round: number

    @Column({allowNull: false})
    declare raceName: string

    @Column({allowNull: false})
    declare circuitId: string

    @Column({allowNull: false})
    declare circuitName: string

    @Column({allowNull: false})
    declare country: string

    @Column({allowNull: false, defaultValue: ''})
    declare locality: string

    @Column({allowNull: false, type: DataType.DATEONLY})
    declare date: string

    /**
     * Race start in UTC. `date` alone cannot say when a classification should
     * be available, which is what the scheduler's checkpoints are measured
     * from. Null when the upstream schedule has no time yet.
     */
    @Column({allowNull: true, type: DataType.DATE})
    declare startsAt: Date | null

    @Column({allowNull: false, defaultValue: false})
    declare hasSprint: boolean

    /** Winner's lap count; 0 until the race has been run and ingested. */
    @Column({allowNull: false, defaultValue: 0})
    declare totalLaps: number

    @HasMany(() => Results, 'seasonId')
    results?: Results[]

    @BelongsTo(() => Season, 'seasonId')
    season?: Season
}
