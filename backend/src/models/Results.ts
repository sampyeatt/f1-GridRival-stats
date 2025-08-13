import {Table, Column, Model, BelongsTo, ForeignKey} from 'sequelize-typescript'
import {Driver} from './Driver'
import {Team} from './Team'
import {Race} from './Race'

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
        type: 'float'
    })
    cost?: number

    @Column({
        allowNull: false
    })
    rank?: number

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

    @Column({
        allowNull: false,
        type: 'float'
    })
    positionDifference?: number

    @Column({
        allowNull: false,
    })
    positionsForMoney?: number

    @Column({
        allowNull: false,
    })
    easeToGainPoints?: number

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

    @ForeignKey(() => Race)
    @Column({
        allowNull: false,
    })
    meeting_key?: number

    @BelongsTo(() => Race, 'meeting_key')
    race?: Race

    @BelongsTo(() => Driver, 'driverId')
    driver?: Driver

    @BelongsTo(() => Team, 'teamId')
    team?: Team


}