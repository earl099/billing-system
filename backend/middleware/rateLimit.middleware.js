/**
 * @fileoverview Rate limiting middleware configurations
 * Uses Redis-backed shared store when REDIS_URL is set (required for multi-instance/LB),
 * falls back to in-memory store for single-instance local dev.
 */

import rateLimit from 'express-rate-limit'
import logger from '#utils/logger.util.js'

/** @type {import('redis').RedisClientType|undefined} */
let redisClient

const redisUrl = process.env.REDIS_URL
if (redisUrl) {
    try {
        const { RedisStore } = await import('rate-limit-redis')
        const { createClient } = await import('redis')
        redisClient = createClient({ url: redisUrl })
        redisClient.on('error', (err) => logger.error('Redis rate-limit client error', err))
        await redisClient.connect()
        logger.info('Rate limiting using Redis shared store')
    } catch (err) {
        redisClient = undefined
        logger.error('REDIS_URL set but Redis rate-limit store unavailable; falling back to memory store', err)
    }
}

/** Build a rate-limit-redis store for a prefix, or undefined for memory fallback. */
let RedisStoreClass
if (redisClient) {
    ({ RedisStore: RedisStoreClass } = await import('rate-limit-redis'))
}
const limitStore = (prefix) => redisClient && RedisStoreClass
    ? new RedisStoreClass({ sendCommand: (...args) => redisClient.sendCommand(args), prefix: `rl:${prefix}:` })
    : undefined

/** Closes the shared Redis client used by rate limiters. */
export async function closeRateLimitStore() {
    if (redisClient?.isOpen) await redisClient.quit()
}

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login/signup attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    store: limitStore('auth')
})

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many API requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: limitStore('api')
})

export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== 'POST',
    store: limitStore('upload')
})

export const dataLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many data requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: limitStore('data')
})
