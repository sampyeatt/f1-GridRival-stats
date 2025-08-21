import {Table, Column, Model, BelongsTo, ForeignKey} from 'sequelize-typescript'
import {Driver} from './Driver'
import {Team} from './Team'
import {Race} from './Race'
import {Season} from './Season'

@Table
export class Results extends Model<Results> {

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
    })
    declare finishPosition: number

    @Column({
        allowNull: false,
        defaultValue: 0
    })
    declare qualiPosition: number

    @Column({
        allowNull: false,
        defaultValue: false
    })
    declare qualiDNS: boolean

    @Column({
        allowNull: false,
        defaultValue: false
    })
    declare raceDNS: boolean

    @Column({
        allowNull: false,
        defaultValue: false
    })
    declare qualiDSQ: boolean

    @Column({
        allowNull: false,
        defaultValue: false
    })
    declare raceDSQ: boolean

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

    @ForeignKey(() => Driver)
    @Column
    declare driverId?: string

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

    @BelongsTo(() => Driver, 'driverId')
    driver?: Driver

    @BelongsTo(() => Team, 'teamId')
    team?: Team

    @BelongsTo(() => Season, 'seasonId')
    season?: Season


}