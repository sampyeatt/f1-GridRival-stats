import {Table, Column, Model, BelongsTo, ForeignKey} from 'sequelize-typescript'
import {Driver} from './Driver'
import {Team} from './Team'

@Table
export class Results extends Model<Results> {

    @ForeignKey(() => Driver)
    @Column({
        allowNull: false,
    })
    driverid: string = ''

    @ForeignKey(() => Team)
    @Column({
        allowNull: false,
    })
    teamid: string = ''

    @Column({
        allowNull: false,
    })
    raceid: string = ''

    @Column({
        allowNull: false,
    })
    points?: number

    @Column({
        allowNull: false,
    })
    cost?: number

    @BelongsTo(() => Driver, 'driverid')
    driver?: Driver

    @BelongsTo(() => Driver, 'teamid')
    team?: Team


}