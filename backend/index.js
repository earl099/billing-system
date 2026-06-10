import 'dotenv/config'
import dns from 'dns'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import ALL_ROUTES from '#routes/index.routes.js'
import path from 'path'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'
import logger from '#utils/logger.util.js'
import { httpLoggerMiddleware } from '#middleware/logger.middleware.js'
import { globalErrorHandler, notFoundHandler } from '#middleware/errorHandler.middleware.js'
import { apiLimiter } from '#middleware/rateLimit.middleware.js'
import { csrfTokenMiddleware } from '#middleware/csrf.middleware.js'

dns.setServers(['8.8.8.8', '8.8.4.4'])
const app = express()

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET environment variable is required')
    process.exit(1)
}

app.use(cors({
    origin: [
        'http://localhost:4200',
        'https://lbrdc-billing-system.netlify.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// HTTP request logging middleware
app.use(httpLoggerMiddleware)

// Global rate limiter for all API requests
app.use('/api', apiLimiter)

// CSRF token middleware - includes token in responses
app.use('/api', csrfTokenMiddleware)

app.use('/api', ALL_ROUTES)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, './uploads')))

// 404 handler for undefined routes
app.use(notFoundHandler)

// Global error handler - MUST be last
app.use(globalErrorHandler)

const PORT = process.env.PORT || 3000
const MONGO = process.env.MONGO_URI

if (!MONGO) {
    console.error('CRITICAL: MONGO_URI environment variable is required')
    process.exit(1)
}

mongoose.connect(MONGO)
.then(() => {
    logger.info('Connected to MongoDB')
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`))
})
.catch(err => {
    logger.error('DB connection error:', err)
    process.exit(1)
})
