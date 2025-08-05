import {BelongsTo, Column, Model, Table, BelongsToMany} from 'sequelize-typescript'
import {PostTag} from './PostTag'
import {Post} from './Post'

@Table
export class Tag extends Model<Tag> {
    @Column({
        allowNull: false
    })
    name: string = ''

    @BelongsToMany(() => Post, ()=> PostTag)
    posts?: Post[] = []
}