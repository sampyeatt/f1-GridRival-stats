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
    declare seasonId: number

    @Column({
        allowNull: false,
        defaultValue: false
    })
    declare currentSeason: boolean

    @HasMany(() => Race)
    races?: Race[] = []

    @HasMany(() => Results)
    results?: Results[] = []

    @HasMany(() => TeamResults)
    teamResults?: TeamResults[] = []
}