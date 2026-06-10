import logger from '#utils/logger.util.js'

/**
 * Global error handler middleware
 * Catches all errors and provides consistent error responses
 * IMPORTANT: This must be the LAST middleware defined in the app
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
 * Validation error handler
 * Converts validation errors to proper HTTP responses
 */
export function handleValidationError(error) {
    const err = new Error('Validation failed')
    err.statusCode = 400
    err.errors = error.errors?.map(e => ({
        field: e.path.join('.'),
        message: e.message
    }))
    return err
}

/**
 * Not found handler
 * Returns 404 for undefined routes
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        message: 'Resource not found',
        path: req.path
    })
}

/**
 * Async wrapper for route handlers
 * Catches errors in async functions and passes to error handler
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}
