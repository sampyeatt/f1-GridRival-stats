import {BelongsTo, Column, ForeignKey, HasMany, Model, PrimaryKey, Table} from 'sequelize-typescript'
import {Results} from './Results'
import {Team} from './Team'

@Table
export class Driver extends Model<Driver> {

    @PrimaryKey
    @Column({
        allowNull: false,
        unique: true
    })
    declare driverId: string

    @Column({
        allowNull: false
    })
    declare driverName: string

    @Column({
        allowNull: false,
        unique: true
    })
    declare driverNumber: number

    @Column({
        allowNull: false
    })
    declare shortName: string

    @Column({
        allowNull: false
    })
    declare active: boolean

    @ForeignKey(() => Team)
    @Column({
        allowNull: false
    })
    declare teamId: string

    @HasMany(() => Results)
    results?: Results[] = []

    @BelongsTo(() => Team)
    team?: Team
}