import {Sequelize} from 'sequelize-typescript'

export const connection = new Sequelize({
    dialect: 'postgres',
    host: 'f1-grod-db',
    username: 'f1-data-user',
    password: 'database-dockerpassword-here',
    database: 'postgres',
    port: 5435,
    models: [__dirname + '/../models']
})