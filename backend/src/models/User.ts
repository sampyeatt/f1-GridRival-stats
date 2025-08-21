import {
    Table,
    Column,
    Model,
    HasMany,
    PrimaryKey,
    AutoIncrement,
    DataType,
    Default,
    BelongsTo
} from 'sequelize-typescript'

@Table
export class User extends Model<User> {
    @PrimaryKey
    @AutoIncrement
    @Column({
        allowNull: false,
        unique: true
    })
    declare userId: number

    @Column({
        allowNull: false
    })
    declare name: string

    @Column({
        unique: true,
        allowNull: false
    })
    declare email: string

    @Column({
        allowNull: false,
        type: DataType.ENUM('admin', 'user'),
        defaultValue: 'user'
    })
    declare role: 'admin' | 'user'

    @Default('pending')
    @Column({
        allowNull: false,
        type: DataType.ENUM('active', 'pending')
    })
    declare status: 'active' | 'pending'

    @Column({
        allowNull: false
    })
    declare password: string
}