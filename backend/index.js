/**
 * @fileoverview Express application entry point
 * Configures middleware stack, registers routes, connects to MongoDB, and starts the HTTP server
 */

import 'dotenv/config'
import dns from 'dns'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import ALL_ROUTES from '#routes/index.routes.js'
import cookieParser from 'cookie-parser'
import logger from '#utils/logger.util.js'
import { httpLoggerMiddleware } from '#middleware/logger.middleware.js'
import { globalErrorHandler, notFoundHandler } from '#middleware/errorHandler.middleware.js'
import { apiLimiter } from '#middleware/rateLimit.middleware.js'

/** Use Google DNS servers for reliable hostname resolution */
dns.setServers(['8.8.8.8', '8.8.4.4'])
const app = express()

/** Validate required JWT secret at startup */
const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET environment variable is required')
    process.exit(1)
}

/**
 * CORS configuration
 * Allows requests from local dev server and Netlify production deployment
 * Enables credentials and CSRF token header
 */
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200,https://lbrdc-billing-system.netlify.app,https://billing-system-v3jo.onrender.com')
    .split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

/** Body parsing middleware - JSON and URL-encoded with 10MB limit */
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

/** HTTP request logging middleware - logs all requests with timing */
app.use(httpLoggerMiddleware)

/** Global rate limiter for all API requests */
app.use('/api', apiLimiter)


/** Register all application route modules under /api prefix */
app.use('/api', ALL_ROUTES)

/** 404 handler for undefined routes - must be after all route registrations */
app.use(notFoundHandler)

/** Global error handler - MUST be the last middleware in the stack */
app.use(globalErrorHandler)

/** @type {number} Server port from environment or default 3000 */
const PORT = process.env.PORT || 3000
/** @type {string} MongoDB connection URI from environment */
const MONGO = process.env.MONGO_URI

if (!MONGO) {
    console.error('CRITICAL: MONGO_URI environment variable is required')
    process.exit(1)
}

/** Connect to MongoDB and start HTTP server */
mongoose.connect(MONGO)
.then(() => {
    logger.info('Connected to MongoDB')
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`))
})
.catch(err => {
    logger.error('DB connection error:', err)
    process.exit(1)
})
