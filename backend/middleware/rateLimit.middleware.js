/**
 * @fileoverview Rate limiting middleware configurations
 * Provides pre-configured rate limiters for different endpoint categories
 * to prevent brute force attacks and denial-of-service
 */

import rateLimit from 'express-rate-limit'

/**
 * Strict rate limiter for authentication endpoints (login/signup)
 * Allows 5 requests per 15-minute window; skips counting successful requests
 * so only failed attempts contribute to the limit
 * 
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // 5 requests per window
    message: 'Too many login/signup attempts, please try again after 15 minutes',
    standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: true,  // Don't count successful requests
    skip: (req) => {
        // Skip rate limiting for admin/test users if needed
        return false
    }
})

/**
 * Moderate rate limiter for general API endpoints
 * Allows 100 requests per 15-minute window
 * 
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,  // 100 requests per window
    message: 'Too many API requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
})

/**
 * Strict rate limiter for file upload endpoints
 * Allows 20 uploads per hour; only applies to POST requests
 * 
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 20,  // 20 uploads per hour
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Only rate limit POST requests for file uploads
        return req.method !== 'POST'
    }
})

/**
 * Rate limiter for data-heavy list endpoints (users, clients)
 * Allows 30 requests per minute to limit data exposure risk
 * 
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const dataLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 30,  // 30 requests per minute
    message: 'Too many data requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
})
