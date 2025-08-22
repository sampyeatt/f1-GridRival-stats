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
    declare meeting_key: number

    @Column({
        allowNull: false,
        unique: true
    })
    declare circut_key: number

    @Column({
        allowNull: false
    })
    declare meeting_name: string

    @Column({
        allowNull: false
    })
    declare circuit_short_name: string

    @Column({
        allowNull: false
    })
    declare country_code: string

    @Column({
        allowNull: false
    })
    declare country_name: string

    @Column
    declare sprint_key?: number

    @Column({
        allowNull: false
    })
    declare quali_key: number

    @Column({
        allowNull: false
    })
    declare race_key: number

    @Column({
        allowNull: false
    })
    declare round: number

    @Column({
        allowNull: false
    })
    declare totalLaps: number

    @Column({
        allowNull: false
    })
    declare raceId: string

    @ForeignKey(() => Season)
    @Column({
        allowNull: false,
    })
    declare seasonId: number

    @HasMany(() => Results)
    results?: Results[] = []

    @BelongsTo(() => Season, 'seasonId')
    season?: Season

}