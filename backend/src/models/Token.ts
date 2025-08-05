import {BelongsTo, Column, Model, Table, BelongsToMany, ForeignKey, DataType} from 'sequelize-typescript'
import {User} from './User'

@Table
export class Token extends Model<Token> {

    @Column({
        allowNull: false
    })
    token: string = ''

    @ForeignKey(() => User)
    @Column({
        allowNull: false
    })
    userId?: number

    @BelongsTo(() => User)
    user?: User

    @Column({
        type: DataType.ENUM('activation', 'reset')
    })
    type?: 'activation' | 'reset'
}