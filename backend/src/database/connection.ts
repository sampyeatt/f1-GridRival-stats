// sequelize-typescript reads column types through Reflect.getMetadata, which
// only exists once this polyfill is loaded. It currently arrives via that
// package's own internal requires, where it is declared as a "*" peer
// dependency — imported explicitly here so the models cannot start failing to
// register because of someone else's refactor.
import 'reflect-metadata'
import {Sequelize} from 'sequelize-typescript'
import dotenv from 'dotenv'

dotenv.config({
    path: './src/.env'
})

import {Season} from '../models/Season'
import {Race} from '../models/Race'
import {Team} from '../models/Team'
import {Driver} from '../models/Driver'
import {Results} from '../models/Results'
import {TeamResults} from '../models/TeamResults'
import {RawIngest} from '../models/RawIngest'
import {IngestRun} from '../models/IngestRun'
import {User} from '../models/User'
import {Token} from '../models/Token'

export const connection = new Sequelize({
    dialect: 'postgres',
    host: process.env.PG_HOST as string,
    username: process.env.PG_USER_NAME as string,
    password: process.env.PG_PASSWORD as string,
    database: process.env.PG_DATABASE as string,
    port: Number(process.env.PG_PORT) || 5435,
    logging: false,
    // Listed explicitly rather than glob-loaded from a directory path: the glob
    // resolves against __dirname, so it silently found nothing once the code
    // was compiled into dist/.
    models: [Season, Race, Team, Driver, Results, TeamResults, RawIngest, IngestRun, User, Token]
})
