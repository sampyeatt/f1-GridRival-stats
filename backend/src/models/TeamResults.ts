import {Table, Column, Model, BelongsTo, ForeignKey} from 'sequelize-typescript'
import {Team} from './Team'
import {Race} from './Race'
import {Season} from './Season'

@Table
export class TeamResults extends Model<TeamResults> {

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
    round?: number

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

    @ForeignKey(() => Season)
    @Column({
        allowNull: false,
    })
    seasonId?: number

    @BelongsTo(() => Race, 'meeting_key')
    race?: Race

    @BelongsTo(() => Team, 'teamId')
    team?: Team

    @BelongsTo(() => Season, 'seasonId')
    season?: Season
}