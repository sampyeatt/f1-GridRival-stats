import {DataTypes, QueryInterface} from 'sequelize'

/**
 * Re-keys the schema from OpenF1's meeting_key scheme to (season, round).
 *
 * Written as a create-from-scratch rather than an in-place alter: the existing
 * data is regenerable from the upstream API, so a rebuild is both simpler and
 * safer than trying to migrate rows whose round numbers were derived from an
 * array index.
 *
 * Users and Tokens are left alone — they hold the only data that is not
 * re-ingestable.
 */
export async function up({context}: {context: QueryInterface}): Promise<void> {
    const timestamps = {
        createdAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
        updatedAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW}
    }

    // Old tables are dropped in FK order. `Seasons` is recreated below.
    for (const table of ['Results', 'TeamResults', 'Races', 'Drivers', 'Teams', 'Seasons']) {
        await context.dropTable(table, {cascade: true}).catch(() => undefined)
    }

    await context.createTable('Seasons', {
        seasonId: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
        currentSeason: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        ...timestamps
    })

    await context.createTable('Teams', {
        teamId: {type: DataTypes.STRING, primaryKey: true, allowNull: false},
        teamName: {type: DataTypes.STRING, allowNull: false},
        ...timestamps
    })

    await context.createTable('Drivers', {
        driverId: {type: DataTypes.STRING, primaryKey: true, allowNull: false},
        driverName: {type: DataTypes.STRING, allowNull: false},
        // Deliberately NOT unique: Jolpica reports the same permanentNumber for
        // more than one driver (ricciardo and max_verstappen are both 3 in
        // 2024), and the old unique constraint would reject the import.
        driverNumber: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        shortName: {type: DataTypes.STRING, allowNull: false},
        active: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
        teamId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {model: 'Teams', key: 'teamId'},
            onUpdate: 'CASCADE'
        },
        ...timestamps
    })

    await context.createTable('Races', {
        seasonId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: {model: 'Seasons', key: 'seasonId'},
            onDelete: 'CASCADE'
        },
        round: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
        raceName: {type: DataTypes.STRING, allowNull: false},
        circuitId: {type: DataTypes.STRING, allowNull: false},
        circuitName: {type: DataTypes.STRING, allowNull: false},
        country: {type: DataTypes.STRING, allowNull: false},
        locality: {type: DataTypes.STRING, allowNull: false, defaultValue: ''},
        date: {type: DataTypes.DATEONLY, allowNull: false},
        hasSprint: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        totalLaps: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        ...timestamps
    })

    await context.createTable('Results', {
        seasonId: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
        round: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
        driverId: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            references: {model: 'Drivers', key: 'driverId'},
            onUpdate: 'CASCADE'
        },
        teamId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {model: 'Teams', key: 'teamId'},
            onUpdate: 'CASCADE'
        },
        points: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        cost: {type: DataTypes.FLOAT, allowNull: false, defaultValue: 0},
        rank: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        racePosition: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        qualiPosition: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        sprintPosition: {type: DataTypes.INTEGER, allowNull: true},
        lapsCompleted: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        raceStatus: {
            type: DataTypes.ENUM('classified', 'dnf', 'dns', 'dsq'),
            allowNull: false,
            defaultValue: 'classified'
        },
        qualiStatus: {
            type: DataTypes.ENUM('classified', 'dns', 'dsq'),
            allowNull: false,
            defaultValue: 'classified'
        },
        positionDifference: {type: DataTypes.FLOAT, allowNull: false, defaultValue: 0},
        positionsForMoney: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        easeToGainPoints: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        provisional: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
        ingestedAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
        ...timestamps
    })

    await context.createTable('TeamResults', {
        seasonId: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
        round: {type: DataTypes.INTEGER, primaryKey: true, allowNull: false},
        teamId: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            references: {model: 'Teams', key: 'teamId'},
            onUpdate: 'CASCADE'
        },
        points: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        cost: {type: DataTypes.FLOAT, allowNull: false, defaultValue: 0},
        rank: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        positionDifference: {type: DataTypes.FLOAT, allowNull: false, defaultValue: 0},
        positionsForMoney: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        easeToGainPoints: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        provisional: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
        ingestedAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
        ...timestamps
    })

    await context.createTable('RawIngest', {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false},
        source: {type: DataTypes.STRING, allowNull: false, defaultValue: 'jolpica'},
        seasonId: {type: DataTypes.INTEGER, allowNull: false},
        round: {type: DataTypes.INTEGER, allowNull: true},
        session: {type: DataTypes.STRING, allowNull: false},
        payload: {type: DataTypes.JSONB, allowNull: false},
        fetchedAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
        createdAt: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW}
    })

    // Composite FKs onto Races. Sequelize's addConstraint cannot express a
    // multi-column reference, and its association layer does not model one
    // well either — so they are declared in SQL for integrity and left out of
    // the model definitions, which only need the simple driver/team joins.
    await context.sequelize.query(`
        ALTER TABLE "Results" ADD CONSTRAINT "Results_race_fkey"
        FOREIGN KEY ("seasonId", "round") REFERENCES "Races" ("seasonId", "round")
        ON DELETE CASCADE
    `)
    await context.sequelize.query(`
        ALTER TABLE "TeamResults" ADD CONSTRAINT "TeamResults_race_fkey"
        FOREIGN KEY ("seasonId", "round") REFERENCES "Races" ("seasonId", "round")
        ON DELETE CASCADE
    `)

    // The rolling-average lookup in the scoring engine is the hottest query in
    // the app: Results WHERE driverId = ? AND seasonId = ? AND round BETWEEN ?
    await context.addIndex('Results', {
        name: 'results_driver_season_round_idx',
        fields: ['driverId', 'seasonId', 'round']
    })
    await context.addIndex('Results', {
        name: 'results_season_round_idx',
        fields: ['seasonId', 'round']
    })
    await context.addIndex('TeamResults', {
        name: 'teamresults_season_round_idx',
        fields: ['seasonId', 'round']
    })
    await context.addIndex('RawIngest', {
        name: 'rawingest_lookup_idx',
        fields: ['seasonId', 'round', 'session']
    })
    await context.addIndex('Tokens', {name: 'tokens_token_idx', fields: ['token']})
        .catch(() => undefined)
}

export async function down({context}: {context: QueryInterface}): Promise<void> {
    for (const table of ['RawIngest', 'TeamResults', 'Results', 'Races', 'Drivers', 'Teams', 'Seasons']) {
        await context.dropTable(table, {cascade: true}).catch(() => undefined)
    }
}
