import {BelongsTo, Column, Model, Table, BelongsToMany, ForeignKey} from 'sequelize-typescript'
import {PostTag} from './PostTag'
import {Post} from './Post'
import {User} from './User'

@Table
export class Tag extends Model<Tag> {
    @Column({
        allowNull: false
    })
    name: string = ''

    @ForeignKey(() => User)
    @Column({
        allowNull: false
    })
    userId?: number

    @BelongsToMany(() => Post, ()=> PostTag)
    posts?: Post[] = []

    @BelongsTo(() => User)
    user?: User
}