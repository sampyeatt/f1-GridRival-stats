import dotenv from 'dotenv'
dotenv.config({
    path: './src/.env'
})

import express from 'express'
import './database/index'
import categoryRoutes from './routes/category.routes'
import userRoutes from './routes/user.routes'
import driverRoutes from './routes/driver.routes'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api/categories', categoryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/drivers', driverRoutes)

app.listen(port, () => console.log(`Example app listening on port http://localhost:${port}!`))
