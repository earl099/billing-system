import crypto from 'crypto'

/**
 * Simple CSRF token middleware
 * Generates and validates CSRF tokens to prevent cross-site request forgery
 */

const CSRF_SECRET = process.env.CSRF_SECRET
if (!CSRF_SECRET) {
    throw new Error('CRITICAL: CSRF_SECRET environment variable is required')
}

/**
 * Generate CSRF token
 * Should be called once per user session
 */
export function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex')
}

/**
 * Validate CSRF token
 * Verifies that the token matches the expected format
 */
export function validateCsrfToken(token) {
    if (!token || typeof token !== 'string' || token.length !== 64) {
        return false
    }
    // Check if it's a valid hex string
    return /^[a-f0-9]{64}$/.test(token)
}

/**
 * CSRF middleware - includes token in response
 * For GET requests, includes CSRF token in response
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
 * CSRF protection middleware - validates token on unsafe methods
 * For POST, PUT, DELETE, PATCH requests
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
