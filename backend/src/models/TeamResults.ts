import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from 'sequelize-typescript'
import {Team} from './Team'
import {Season} from './Season'

/** One row per constructor per round, keyed by (seasonId, round, teamId). */
@Table({tableName: 'TeamResults'})
export class TeamResults extends Model<TeamResults> {

    @PrimaryKey
    @ForeignKey(() => Season)
    @Column({allowNull: false})
    declare seasonId: number

    @PrimaryKey
    @Column({allowNull: false})
    declare round: number

    @PrimaryKey
    @ForeignKey(() => Team)
    @Column({allowNull: false})
    declare teamId: string

    @Column({allowNull: false, defaultValue: 0})
    declare points: number

    @Column({allowNull: false, type: DataType.FLOAT, defaultValue: 0})
    declare cost: number

    @Column({allowNull: false, defaultValue: 0})
    declare rank: number

    @Column({allowNull: false, type: DataType.FLOAT, defaultValue: 0})
    declare positionDifference: number

    @Column({allowNull: false, defaultValue: 0})
    declare positionsForMoney: number

    @Column({allowNull: false, defaultValue: 0})
    declare easeToGainPoints: number

    @Column({allowNull: false, defaultValue: true})
    declare provisional: boolean

    @Column({allowNull: false, type: DataType.DATE, defaultValue: DataType.NOW})
    declare ingestedAt: Date

    @BelongsTo(() => Team, 'teamId')
    team?: Team

    @BelongsTo(() => Season, 'seasonId')
    season?: Season
}
