import {Sequelize} from 'sequelize-typescript'
import 'dotenv/config'
import dotenv from 'dotenv'
dotenv.config({
    path: './src/.env'
})

export const connection = new Sequelize({
    dialect: 'postgres',
    host: process.env.PG_HOST as string,
    username: process.env.PG_USER_NAME as string,
    password: process.env.PG_PASSWORD as string,
    database: process.env.PG_DATABASE as string,
    port: process.env.PG_PORT as any || 5435,
    models: [__dirname + '/../models']
})