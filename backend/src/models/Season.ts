import {Column, Model, Table, HasMany, PrimaryKey} from 'sequelize-typescript'
import {Results} from './Results'
import {TeamResults} from './TeamResults'
import {Race} from './Race'



@Table
export class Season extends Model<Season> {

    @PrimaryKey
    @Column({
        allowNull: false,
        unique: true
    })
    seasonId?: number

    @Column({
        allowNull: false,
        defaultValue: false
    })
    currentSeason?: boolean

    @HasMany(() => Race)
    races?: Race[] = []

    @HasMany(() => Results)
    results?: Results[] = []

    @HasMany(() => TeamResults)
    teamResults?: TeamResults[] = []
}