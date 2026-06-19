/**
 * @fileoverview HTTP request logging and audit middleware
 * Provides request logging with response timing, audit trails for security-sensitive operations,
 * error logging with request context, and security event tracking
 */

import logger from '#utils/logger.util.js'

/**
 * HTTP request logging middleware
 * Logs all incoming requests with method, path, status code, and response time.
 * Requests resulting in 4xx/5xx responses are logged at WARN level.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
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
 * Logs security-sensitive user actions for audit trail purposes
 * Records the action, user, timestamp, and any additional contextual details
 * 
 * @param {string} action - Description of the audited action (e.g., 'Password changed', 'Role modified')
 * @param {string} userId - ID of the user performing the action
 * @param {Object} [details={}] - Additional context about the action
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
 * Logs application errors with optional request context for debugging
 * Attaches request method, path, user ID, and IP when a request object is provided
 * 
 * @param {Error} error - The error to log
 * @param {import('express').Request|null} [req=null] - Optional Express request for context
 * @param {Object} [context={}] - Additional contextual data about the error
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
 * Logs security-related events such as failed login attempts and authorization failures
 * Records event type, timestamp, and additional details
 * 
 * @param {string} eventType - Type of security event (e.g., 'FAILED_LOGIN', 'UNAUTHORIZED_ACCESS')
 * @param {Object} [details={}] - Additional context about the security event
 */
export function logSecurityEvent(eventType, details = {}) {
    logger.warn('SECURITY EVENT', {
        type: eventType,
        timestamp: new Date().toISOString(),
        ...details
    })
}
