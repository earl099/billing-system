import rateLimit from 'express-rate-limit'

/**
 * Rate limiters for different endpoints
 * Prevents brute force attacks and DoS
 */

// Strict rate limit for auth endpoints
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

// Moderate rate limit for API endpoints
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,  // 100 requests per window
    message: 'Too many API requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
})

// Strict rate limit for file uploads
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

// Strict rate limit for user/client list endpoints (data exposure risk)
export const dataLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 30,  // 30 requests per minute
    message: 'Too many data requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
})
