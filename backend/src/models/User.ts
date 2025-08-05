import {Table, Column, Model, HasMany, PrimaryKey, AutoIncrement} from 'sequelize-typescript'
import {Post} from './Post'
import {Comment} from './Comment'
import {Token} from './Token'
import {Category} from './Category'
import {Tag} from './Tag'

@Table
export class User extends Model<User> {
    @PrimaryKey
    @AutoIncrement
    @Column({
        allowNull: false,
        unique: true
    })
    userId?: number

    @Column({
        allowNull: false
    })
    name?: string

    @Column({
        unique: true,
        allowNull: false
    })
    email?: string

    @Column({
        allowNull: false
    })
    password?: string

    @HasMany(() => Post)
    posts?: Post[] = []

    @HasMany(() => Comment)
    comments?: Comment[] = []

    @HasMany(() => Token)
    tokens?: Token[] = []

    @HasMany(() => Category)
    categories?: Category[] = []

    @HasMany(() => Tag)
    tags?: Tag[] = []
}