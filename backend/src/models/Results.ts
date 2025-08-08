import {Table, Column, Model, BelongsTo, ForeignKey} from 'sequelize-typescript'
import {Driver} from './Driver'
import {Team} from './Team'

@Table
export class Results extends Model<Results> {

    @Column({
        allowNull: false,
    })
    raceId?: string

    @Column({
        allowNull: false,
    })
    points?: number

    @Column({
        allowNull: false,
    })
    cost?: number

    @Column({
        allowNull: false,
    })
    seasonId?: number

    @Column({
        allowNull: false,
    })
    round?: number

    @Column({
        allowNull: false,
    })
    finishPosition?: number

    @ForeignKey(() => Driver)
    @Column({
        allowNull: false,
    })
    driverId?: string

    @ForeignKey(() => Team)
    @Column({
        allowNull: false,
    })
    teamId?: string

    @BelongsTo(() => Driver, 'driverId')
    driver?: Driver

    @BelongsTo(() => Team, 'teamId')
    team?: Team


}