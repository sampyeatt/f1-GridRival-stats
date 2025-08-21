import {Table, Column, Model, BelongsTo, ForeignKey} from 'sequelize-typescript'
import {Team} from './Team'
import {Race} from './Race'
import {Season} from './Season'

@Table
export class TeamResults extends Model<TeamResults> {

    @Column({
        allowNull: false,
    })
    declare raceId: string

    @Column({
        allowNull: false,
    })
    declare points: number

    @Column({
        allowNull: false,
        type: 'float'
    })
    declare cost: number

    @Column({
        allowNull: false
    })
    declare rank: number

    @Column({
        allowNull: false,
    })
    declare round: number

    @Column({
        allowNull: false,
        type: 'float'
    })
    declare positionDifference: number

    @Column({
        allowNull: false,
    })
    declare positionsForMoney: number

    @Column({
        allowNull: false,
    })
    declare easeToGainPoints: number

    @ForeignKey(() => Team)
    @Column({
        allowNull: false,
    })
    declare teamId: string

    @ForeignKey(() => Race)
    @Column({
        allowNull: false,
    })
    declare meeting_key: number

    @ForeignKey(() => Season)
    @Column({
        allowNull: false,
    })
    declare seasonId: number

    @BelongsTo(() => Race, 'meeting_key')
    race?: Race

    @BelongsTo(() => Team, 'teamId')
    team?: Team

    @BelongsTo(() => Season, 'seasonId')
    season?: Season
}