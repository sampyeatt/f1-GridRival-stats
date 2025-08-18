import {Sequelize} from 'sequelize-typescript'

export const connection = new Sequelize({
    dialect: 'postgres',
    host: 'localhost',
    username: 'postgres',
    password: 'postgres',
    database: 'postgres',
    port: 5435,
    models: [__dirname + '/../models']
})