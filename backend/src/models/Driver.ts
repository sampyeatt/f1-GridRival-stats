import {BelongsTo, Column, ForeignKey, HasMany, Model, PrimaryKey, Table} from 'sequelize-typescript'
import {Results} from './Results'
import {Team} from './Team'

@Table({tableName: 'Drivers'})
export class Driver extends Model<Driver> {

    @PrimaryKey
    @Column({allowNull: false})
    declare driverId: string

    @Column({allowNull: false})
    declare driverName: string

    /**
     * Display metadata only, and deliberately NOT unique: Jolpica reports the
     * same permanentNumber for more than one driver (ricciardo and
     * max_verstappen both come back as 3 for 2024). Every join in the app is on
     * driverId.
     */
    @Column({allowNull: false, defaultValue: 0})
    declare driverNumber: number

    @Column({allowNull: false})
    declare shortName: string

    @Column({allowNull: false, defaultValue: true})
    declare active: boolean

    /** Most recent constructor; the per-round pairing lives on Results.teamId. */
    @ForeignKey(() => Team)
    @Column({allowNull: false})
    declare teamId: string

    @HasMany(() => Results)
    results?: Results[]

    @BelongsTo(() => Team)
    team?: Team
}
