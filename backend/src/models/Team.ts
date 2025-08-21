import {Column, HasMany, Model, PrimaryKey, Table} from 'sequelize-typescript'
import {Driver} from './Driver'
import {Results} from './Results'
import {TeamResults} from './TeamResults'

@Table
export class Team extends Model<Team> {

    @PrimaryKey
    @Column({
        allowNull: false,
        unique: true
    })
    declare teamId: string

    @Column({
        allowNull: false
    })
    declare teamName: string

    @HasMany(() => Driver)
    drivers?: Driver[] = []

    @HasMany(() => Results)
    results?: Results[] = []

    @HasMany(() => TeamResults)
    teamResults?: TeamResults[] = []
}