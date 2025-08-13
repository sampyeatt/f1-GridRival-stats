import {Table, Column, Model, HasMany, PrimaryKey, AutoIncrement, DataType, Default} from 'sequelize-typescript'

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

    @Default('pending')
    @Column({
        allowNull: false,
        type: DataType.ENUM('active', 'pending')
    })
    status?: 'active' | 'pending'

    @Column({
        allowNull: false
    })
    password?: string
}