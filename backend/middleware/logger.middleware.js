import logger from '#utils/logger.util.js'

/**
 * HTTP request logging middleware
 * Logs all incoming requests with method, path, status, and response time
 */
export function httpLoggerMiddleware(req, res, next) {
    const start = Date.now()
    
    res.on('finish', () => {
        const duration = Date.now() - start
        const logData = {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id || 'anonymous'
        }
        
        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData)
        } else {
            logger.http('HTTP Request', logData)
        }
    })

    next()
}

/**
 * Audit logging for security-sensitive operations
 * Logs user actions with full context
 */
export function auditLog(action, userId, details = {}) {
    logger.warn('AUDIT', {
        action,
        userId,
        timestamp: new Date().toISOString(),
        ...details
    })
}

/**
 * Error logging with context
 * Logs errors with request context for debugging
 */
export function logError(error, req = null, context = {}) {
    const errorData = {
        message: error.message,
        stack: error.stack,
        ...context
    }
    
    if (req) {
        errorData.request = {
            method: req.method,
            path: req.path,
            userId: req.user?.id,
            ip: req.ip
        }
    }
    
    logger.error('Application Error', errorData)
}

/**
 * Security event logging
 * Logs failed authentication attempts, authorization failures, etc.
 */
export function logSecurityEvent(eventType, details = {}) {
    logger.warn('SECURITY EVENT', {
        type: eventType,
        timestamp: new Date().toISOString(),
        ...details
    })
}
