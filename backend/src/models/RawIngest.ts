import {AutoIncrement, Column, DataType, Model, PrimaryKey, Table} from 'sequelize-typescript'

/**
 * Every upstream payload, stored untouched before it is parsed.
 *
 * Two things this buys: a scoring-rule change becomes a replay over stored
 * JSON instead of ~75 more requests to a rate-limited API, and when a round
 * scores oddly you can see exactly what the upstream said at the time.
 */
@Table({tableName: 'RawIngest', updatedAt: false})
export class RawIngest extends Model<RawIngest> {

    @PrimaryKey
    @AutoIncrement
    @Column({allowNull: false})
    declare id: number

    @Column({allowNull: false, defaultValue: 'jolpica'})
    declare source: string

    @Column({allowNull: false})
    declare seasonId: number

    /** Null for season-level payloads (schedule, driver and constructor lists). */
    @Column({allowNull: true, type: DataType.INTEGER})
    declare round: number | null

    /** 'results' | 'qualifying' | 'sprint' | 'schedule' | 'drivers' | 'constructors' */
    @Column({allowNull: false})
    declare session: string

    @Column({allowNull: false, type: DataType.JSONB})
    declare payload: unknown

    @Column({allowNull: false, type: DataType.DATE, defaultValue: DataType.NOW})
    declare fetchedAt: Date
}
