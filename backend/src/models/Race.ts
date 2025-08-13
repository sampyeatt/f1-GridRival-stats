import {Column, Model, Table, HasMany, BelongsTo, PrimaryKey} from 'sequelize-typescript'
import {Results} from './Results'


@Table
export class Race extends Model<Race> {

    @PrimaryKey
    @Column({
        allowNull: false,
        unique: true
    })
    meeting_key?: number

    @Column({
        allowNull: false,
        unique: true
    })
    circut_key?: number

    @Column({
        allowNull: false
    })
    circuit_short_name?: string

    @Column({
        allowNull: false
    })
    country_code?: string

    @Column({
        allowNull: false
    })
    country_name?: string

    @Column
    sprint_key?: number

    @Column({
        allowNull: false
    })
    quali_key?: number

    @Column({
        allowNull: false
    })
    race_key?: number

    @Column({
        allowNull: false
    })
    seasonId?: number

    @Column({
        allowNull: false
    })
    round?: number

    @HasMany(() => Results)
    results?: Results[] = []
}