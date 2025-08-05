import dotenv from 'dotenv'
dotenv.config({
    path: './src/.env'
})

import express from 'express'
import './database/index'
import categoryRoutes from './routes/category.routes'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/categories', categoryRoutes)

app.listen(port, () => console.log(`Example app listening on port http://localhost:${port}!`))
