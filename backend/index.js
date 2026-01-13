import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import ALL_ROUTES from '#routes/index.routes.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', ALL_ROUTES)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, '../frontend/src/uploads')))

const PORT = process.env.PORT || 3000
const MONGO = process.env.MONGO_URI || 'mongodb+srv://earlsaturay09:Lbrdc2021.@billing-system.j1yrr.mongodb.net/'

mongoose.connect(MONGO, {})
.then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log('Server running on ', PORT))
})
.catch(err => {
    console.error('DB connection error: ', err)
})
