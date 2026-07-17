/**
 * @fileoverview Global error handling middleware
 * Provides centralized error handling for the Express application including
 * global error catching, validation error formatting, 404 handling, and async route wrappers
 * 
 * IMPORTANT: globalErrorHandler must be the LAST middleware registered in the app
 */

import logger from '#utils/logger.util.js'

/**
 * Global error handler middleware
 * Catches all unhandled errors, logs them with context, and returns
 * consistent JSON error responses. Includes stack traces in development mode only.
 * 
 * @param {Error & { statusCode?: number, status?: number, errors?: Array<{ path: string[], message: string }> }} err - The error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
export function globalErrorHandler(err, req, res, next) {
    // Log the error
    logger.error('Unhandled Error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id
    })

    // Set error status code (default to 500)
    const statusCode = err.statusCode || err.status || 500
    const isDevelopment = process.env.NODE_ENV === 'development'

    // Build error response
    const errorResponse = {
        message: err.message || 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    }

    // Add validation errors if present
    if (err.errors) {
        errorResponse.errors = err.errors
    }

    res.status(statusCode).json(errorResponse)
}

/**
 * Converts Zod validation errors into standardized HTTP 400 error objects
 * Maps each validation error to a field/message pair for client consumption
 * 
 * @param {{ issues: Array<{ path: string[], message: string }> }} error - Zod validation error object
 * @returns {Error & { statusCode: number, errors: Array<{ field: string, message: string }> }} Formatted error with 400 status
 */
export function handleValidationError(error) {
    const err = new Error('Validation failed')
    err.statusCode = 400
    err.errors = error.issues?.map(e => ({
        field: e.path.join('.'),
        message: e.message
    }))
    return err
}

/**
 * 404 handler for undefined routes
 * Returns a JSON response with the requested path for debugging
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        message: 'Resource not found',
        path: req.path
    })
}

/**
 * Async route handler wrapper
 * Wraps async Express route handlers to automatically catch rejected promises
 * and forward errors to the global error handler via next()
 * 
 * @param {Function} fn - Async route handler function (req, res, next) => Promise
 * @returns {Function} Wrapped middleware that catches async errors
 * 
 * @example
 * router.get('/items', asyncHandler(async (req, res) => {
 *     const items = await Item.find()
 *     res.json(items)
 * }))
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}
