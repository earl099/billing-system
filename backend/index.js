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
import compression from 'compression'
import logger from '#utils/logger.util.js'
import { httpLoggerMiddleware } from '#middleware/logger.middleware.js'
import { globalErrorHandler, notFoundHandler } from '#middleware/errorHandler.middleware.js'
import { apiLimiter, closeRateLimitStore } from '#middleware/rateLimit.middleware.js'

/** Use Google DNS servers for reliable hostname resolution */
dns.setServers(['8.8.8.8', '8.8.4.4'])
const app = express()

/** Trust proxy hops when behind a load balancer/reverse proxy (e.g. TRUST_PROXY=1 or true). */
const trustProxy = process.env.TRUST_PROXY
if (trustProxy) {
    const parsed = trustProxy === 'true' ? true : Number(trustProxy)
    app.set('trust proxy', Number.isNaN(parsed) ? trustProxy : parsed)
}

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
app.use(compression())

/** HTTP request logging middleware - logs all requests with timing */
app.use(httpLoggerMiddleware)

/** Health endpoints for load balancers; excluded from rate limiting. */
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }))
app.get('/api/ready', (_req, res) => {
    const ready = mongoose.connection.readyState === 1
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' })
})

/** Global rate limiter for all API requests */
app.use('/api', apiLimiter)
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    next()
})

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

let server
let shuttingDown = false

async function shutdown(signal) {
    if (shuttingDown) return
    shuttingDown = true
    logger.info(`${signal} received; shutting down`)

    const forceTimer = setTimeout(() => {
        logger.error('Graceful shutdown timed out; forcing exit')
        process.exit(1)
    }, 15000)
    forceTimer.unref()

    if (server) {
        await new Promise((resolve) => server.close(resolve))
    }
    await Promise.allSettled([mongoose.connection.close(), closeRateLimitStore()])
    process.exit(0)
}

process.on('SIGTERM', () => { shutdown('SIGTERM').catch((err) => { logger.error('Shutdown error', err); process.exit(1) }) })
process.on('SIGINT', () => { shutdown('SIGINT').catch((err) => { logger.error('Shutdown error', err); process.exit(1) }) })

/** Connect to MongoDB and start HTTP server */
mongoose.connect(MONGO)
.then(() => {
    logger.info('Connected to MongoDB')
    server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`))
})
.catch(err => {
    logger.error('DB connection error:', err)
    process.exit(1)
})
