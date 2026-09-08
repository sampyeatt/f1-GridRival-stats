import dotenv from 'dotenv'
dotenv.config({
    path: './src/.env'
})

import express from 'express'
import './database/index'
import userRoutes from './routes/user.routes'
import driverRoutes from './routes/driver.routes'
import teamRoutes from './routes/team.routes'
import authRoutes from './routes/auth.routes'
import logger from './shared/logger.util'
import resultsRoutes from './routes/results.routes'
import teamResultsRoutes from './routes/teamresults.routes'
import raceRoutes from './routes/race.routes'
import cors from 'cors'
import {Request, Response} from 'express'
import seasonRoutes from './routes/season.routes'
import schedulerRoutes from './routes/scheduler.routes'
import {startScheduler} from './scheduler'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
// Every deployment now serves the app and the API from one origin — nginx
// proxies /api/, and `ng serve` does the same through proxy.conf.json — so no
// browser request is cross-origin and CORS is off by default. Set
// CORS_ORIGINS (comma-separated) to re-enable it for a separate client.
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean)
if (corsOrigins?.length) {
    app.use(cors({origin: corsOrigins, credentials: true}))
}


app.use('/api/users', userRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/result', resultsRoutes)
app.use('/api/teamresult', teamResultsRoutes)
app.use('/api/race', raceRoutes)
app.use('/api/season', seasonRoutes)
app.use('/api/scheduler', schedulerRoutes)

app.use((err: Error, req: Request, res: Response, next: any) => {
    logger.error({
        message: err.message, stack: err.stack,
    })
    res.status(500).send({message: 'Internal server error'})
})

app.listen(port, () => {
    console.log(`App listening on port http://localhost:${port}!`)
    console.log(`Database connected to ${process.env.PG_HOST}`)
    startScheduler()
})