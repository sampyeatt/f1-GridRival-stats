import dotenv from 'dotenv'
dotenv.config({
    path: './src/.env'
})

import express from 'express'
import './database/index'
import categoryRoutes from './routes/category.routes'
import userRoutes from './routes/user.routes'
import driverRoutes from './routes/driver.routes'
import teamRoutes from './routes/team.routes'
import authRoutes from './routes/auth.routes'
// import { authenticateJWT, generateToken } from './shared/auth.util'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api/categories', categoryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/auth', authRoutes)

app.listen(port, () => console.log(`Example app listening on port http://localhost:${port}!`))

// app.get('/test', authenticateJWT, (req, resp) =>{
//     resp.json((req as any).user)
// })
//
// console.log(generateToken(2))
// console.log(require("crypto".randomBytes(64).toString("base64"))