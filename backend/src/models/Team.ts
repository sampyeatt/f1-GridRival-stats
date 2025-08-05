import {Column, HasMany, Model, PrimaryKey, Table} from 'sequelize-typescript'
import {Driver} from './Driver'

@Table
export class Team extends Model<Team> {

    @PrimaryKey
    @Column({
        allowNull: false,
        unique: true
    })
    teamId: string = ''

    @Column({
        allowNull: false
    })
    teamName: string = ''

    @HasMany(() => Driver)
    drivers?: Driver[] = []
}