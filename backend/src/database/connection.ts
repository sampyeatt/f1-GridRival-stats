import {Sequelize} from 'sequelize-typescript'

export const connection = new Sequelize({
    dialect: 'postgres',
    host: '127.0.0.1',
    username: 'postgres',
    password: 'postgres',
    database: 'postgres',
    port: 5435,
    models: [__dirname + '/../models']
})