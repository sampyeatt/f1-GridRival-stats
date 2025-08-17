import {Column, Model, Table, HasMany, BelongsTo, PrimaryKey, ForeignKey} from 'sequelize-typescript'
import {Results} from './Results'
import {Season} from './Season'


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
    meeting_name?: string

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
    round?: number

    @Column({
        allowNull: true
    })
    totalLaps?: number

    @ForeignKey(() => Season)
    @Column({
        allowNull: false,
    })
    seasonId?: number

    @HasMany(() => Results)
    results?: Results[] = []

    @BelongsTo(() => Season, 'seasonId')
    season?: Season

}