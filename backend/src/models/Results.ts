import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from 'sequelize-typescript'
import {Driver} from './Driver'
import {Team} from './Team'
import {Season} from './Season'

/**
 * One row per driver per round, keyed by (seasonId, round, driverId).
 *
 * The composite primary key is what makes ingest idempotent — the old code
 * tried to dedupe in application land with `_.filter(rows, async r => …)`,
 * which never filtered anything because an async predicate always returns a
 * truthy Promise. Re-running an import is now an upsert.
 */
@Table({tableName: 'Results'})
export class Results extends Model<Results> {

    @PrimaryKey
    @ForeignKey(() => Season)
    @Column({allowNull: false})
    declare seasonId: number

    @PrimaryKey
    @Column({allowNull: false})
    declare round: number

    @PrimaryKey
    @ForeignKey(() => Driver)
    @Column({allowNull: false})
    declare driverId: string

    /** The constructor this driver raced for in THIS round. */
    @ForeignKey(() => Team)
    @Column({allowNull: false})
    declare teamId: string

    @Column({allowNull: false, defaultValue: 0})
    declare points: number

    @Column({allowNull: false, type: DataType.FLOAT, defaultValue: 0})
    declare cost: number

    @Column({allowNull: false, defaultValue: 0})
    declare rank: number

    @Column({allowNull: false, defaultValue: 0})
    declare racePosition: number

    @Column({allowNull: false, defaultValue: 0})
    declare qualiPosition: number

    // Explicit type: a `number | null` union cannot be resolved by
    // sequelize-typescript's design-type reflection.
    @Column({allowNull: true, type: DataType.INTEGER})
    declare sprintPosition: number | null

    @Column({allowNull: false, defaultValue: 0})
    declare lapsCompleted: number

    /**
     * Replaces the four loose booleans (qualiDNS/raceDNS/qualiDSQ/raceDSQ),
     * which could represent states that cannot happen.
     */
    @Column({
        allowNull: false,
        type: DataType.ENUM('classified', 'dnf', 'dns', 'dsq'),
        defaultValue: 'classified'
    })
    declare raceStatus: 'classified' | 'dnf' | 'dns' | 'dsq'

    @Column({
        allowNull: false,
        type: DataType.ENUM('classified', 'dns', 'dsq'),
        defaultValue: 'classified'
    })
    declare qualiStatus: 'classified' | 'dns' | 'dsq'

    @Column({allowNull: false, type: DataType.FLOAT, defaultValue: 0})
    declare positionDifference: number

    @Column({allowNull: false, defaultValue: 0})
    declare positionsForMoney: number

    @Column({allowNull: false, defaultValue: 0})
    declare easeToGainPoints: number

    /**
     * True until the classification is final. Stewards' decisions can land
     * hours or days after the flag; the scheduled re-checks in Phase 4 clear
     * this once the result stops moving.
     */
    @Column({allowNull: false, defaultValue: true})
    declare provisional: boolean

    @Column({allowNull: false, type: DataType.DATE, defaultValue: DataType.NOW})
    declare ingestedAt: Date

    @BelongsTo(() => Driver, 'driverId')
    driver?: Driver

    @BelongsTo(() => Team, 'teamId')
    team?: Team

    @BelongsTo(() => Season, 'seasonId')
    season?: Season
}
