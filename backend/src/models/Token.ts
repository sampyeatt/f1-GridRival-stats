import {BelongsTo, Column, Model, Table, BelongsToMany, ForeignKey, DataType} from 'sequelize-typescript'
import {User} from './User'

@Table
export class Token extends Model<Token> {

    @Column({
        allowNull: false
    })
    token?: string

    @Column({
        type: DataType.ENUM('activation', 'reset', 'access', 'refresh', 'admin')
    })
    type?: 'activation' | 'reset' | 'access' | 'refresh' | 'admin'

    @ForeignKey(() => User)
    @Column({
        allowNull: false
    })
    userId?: number

    @BelongsTo(() => User)
    user?: User
}