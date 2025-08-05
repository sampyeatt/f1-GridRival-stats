import { Sequelize } from "sequelize-typescript"
export const connection = new Sequelize({
    dialect: 'postgres',
    host: '192.168.0.151',
    username: 'postgres',
    password: 'goodscout',
    database: 'postgres',
    port: 5431,
    models: [__dirname + '/../models'],
})