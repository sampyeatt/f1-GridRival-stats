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
    driverId?: string

    @Column({
        allowNull: false
    })
    driverName?: string

    @Column({
        allowNull: false
    })
    active?: boolean

    @ForeignKey(() => Team)
    @Column({
        allowNull: false
    })
    teamId?: string

    @HasMany(() => Results)
    results?: Results[] = []

    @BelongsTo(() => Team, 'teamId')
    team?: Team
}