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

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors({
    origin: [ 'http://f1-grod-frontend:4200', 'https://localhost:443', 'http://localhost:3000', 'http://localhost:4200'],
    credentials: true,
}))


app.use('/api/users', userRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/result', resultsRoutes)
app.use('/api/teamresult', teamResultsRoutes)
app.use('/api/race', raceRoutes)
app.use('/api/season', seasonRoutes)

app.use((err: Error, req: Request, res: Response, next: any) => {
    logger.error({
        message: err.message, stack: err.stack,
    })
    res.status(500).send({message: 'Internal server error'})
})

app.listen(port, () => console.log(`Example app listening on port http://localhost:${port}!`))