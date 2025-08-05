import dotenv from 'dotenv'
dotenv.config({
    path: './src/.env'
})

import express from 'express'
import './database/index'
import categoryRoutes from './routes/category.routes'
import userRoutes from './routes/user.routes'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api/categories', categoryRoutes)
app.use('/api/users', userRoutes)

app.listen(port, () => console.log(`Example app listening on port http://localhost:${port}!`))
