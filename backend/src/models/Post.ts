import {Column, ForeignKey, Model, Table, BelongsTo, HasMany, BelongsToMany} from 'sequelize-typescript'
import {User} from './User'
import {Comment} from './Comment'
import {Tag} from './Tag'
import {PostTag} from './PostTag'

@Table
export class Post extends Model<Post> {

    @Column({
        allowNull: false
    })
    title?: string

    @Column({
        allowNull: false
    })
    content?: string

    @Column({
        allowNull: false,
        unique: true
    })
    slug?: string

    @ForeignKey(() => User)
    @Column({
        allowNull: false
    })
    userId?: number

    @HasMany(() => Comment)
    comments?: Comment[] = []

    @BelongsTo(() => User)
    user?: User

    @BelongsToMany(() => Tag, () => PostTag)
    tags?: Tag[] = []

}