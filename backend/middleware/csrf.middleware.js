/**
 * @fileoverview CSRF (Cross-Site Request Forgery) protection middleware
 * Generates, stores, and validates CSRF tokens to prevent cross-site request forgery attacks
 * Uses session-based token storage with hex-encoded random bytes
 */

import crypto from 'crypto'

/** @type {string} CSRF secret from environment variables */
const CSRF_SECRET = process.env.CSRF_SECRET
if (!CSRF_SECRET) {
    throw new Error('CRITICAL: CSRF_SECRET environment variable is required')
}

/**
 * Generates a cryptographically secure CSRF token
 * Should be called once per user session
 * 
 * @returns {string} 64-character hex-encoded CSRF token
 */
export function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex')
}

/**
 * Validates that a CSRF token has the correct format
 * Checks that it is a 64-character lowercase hexadecimal string
 * 
 * @param {string} token - The CSRF token to validate
 * @returns {boolean} True if the token is valid hex format, false otherwise
 */
export function validateCsrfToken(token) {
    if (!token || typeof token !== 'string' || token.length !== 64) {
        return false
    }
    // Check if it's a valid hex string
    return /^[a-f0-9]{64}$/.test(token)
}

/**
 * CSRF token distribution middleware
 * Generates a CSRF token if one doesn't exist in the session, then attaches it
 * to the request. For GET requests, also includes the token in the X-CSRF-Token response header.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
export function csrfTokenMiddleware(req, res, next) {
    // Generate token if not in session
    if (!req.session?.csrfToken) {
        const token = generateCsrfToken()
        if (req.session) {
            req.session.csrfToken = token
        }
        req.csrfToken = token
    } else {
        req.csrfToken = req.session.csrfToken
    }

    // For GET requests, include token in response headers
    if (req.method === 'GET') {
        res.setHeader('X-CSRF-Token', req.csrfToken)
    }

    next()
}

/**
 * CSRF validation middleware for state-changing requests
 * Validates the CSRF token on POST, PUT, DELETE, and PATCH requests.
 * Checks token from X-CSRF-Token header, request body, or query parameters.
 * Safe methods (GET, HEAD, OPTIONS) pass through without validation.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void} Returns 403 if token is missing/malformed/mismatched, or proceeds to next middleware
 */
export function csrfProtectionMiddleware(req, res, next) {
    // Only check unsafe HTTP methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next()
    }

    const token = req.headers['x-csrf-token'] ||
                  req.body?.csrfToken ||
                  req.query?.csrfToken

    if (!token) {
        return res.status(403).json({
            message: 'CSRF token missing or invalid',
            error: 'CSRF validation failed'
        })
    }

    if (!validateCsrfToken(token)) {
        return res.status(403).json({
            message: 'CSRF token is malformed',
            error: 'CSRF validation failed'
        })
    }

    // Verify token matches session token
    if (req.session?.csrfToken && req.session.csrfToken !== token) {
        return res.status(403).json({
            message: 'CSRF token does not match session',
            error: 'CSRF validation failed'
        })
    }

    req.csrfTokenValid = true
    next()
}
