import {DataTypes, QueryInterface} from 'sequelize'

/**
 * Baseline for the two tables that hold non-regenerable data.
 *
 * These were previously created by `connection.sync()` on boot. Both creates
 * are skipped when the table already exists, so this runs cleanly against a
 * fresh database and against one that sync() had already built.
 */
async function tableExists(context: QueryInterface, name: string): Promise<boolean> {
    const tables = await context.showAllTables()
    return tables.map(t => String(t).toLowerCase()).includes(name.toLowerCase())
}

export async function up({context}: {context: QueryInterface}): Promise<void> {
    const timestamps = {
        createdAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
        updatedAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW}
    }

    if (!(await tableExists(context, 'Users'))) {
        await context.createTable('Users', {
            userId: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false},
            name: {type: DataTypes.STRING, allowNull: false},
            email: {type: DataTypes.STRING, allowNull: false, unique: true},
            role: {type: DataTypes.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user'},
            status: {type: DataTypes.ENUM('active', 'pending'), allowNull: false, defaultValue: 'pending'},
            password: {type: DataTypes.STRING, allowNull: false},
            ...timestamps
        })
    }

    if (!(await tableExists(context, 'Tokens'))) {
        await context.createTable('Tokens', {
            id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false},
            token: {type: DataTypes.TEXT, allowNull: false},
            type: {
                type: DataTypes.ENUM('activation', 'reset', 'access', 'refresh', 'admin'),
                allowNull: true
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {model: 'Users', key: 'userId'},
                onDelete: 'CASCADE'
            },
            ...timestamps
        })
    }
}

export async function down({context}: {context: QueryInterface}): Promise<void> {
    await context.dropTable('Tokens', {cascade: true}).catch(() => undefined)
    await context.dropTable('Users', {cascade: true}).catch(() => undefined)
}
