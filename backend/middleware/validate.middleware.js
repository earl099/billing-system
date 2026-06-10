import { ZodError } from 'zod'

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export function validate(schema) {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.body)
            req.body = validated
            next()
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
                return res.status(400).json({
                    message: 'Validation failed',
                    errors
                })
            }
            
            res.status(500).json({ message: 'Server error' })
        }
    }
}

/**
 * Parse and validate data without middleware
 * Useful for validating data within controller logic
 * 
 * @param {z.ZodSchema} schema - Zod schema
 * @param {*} data - Data to validate
 * @returns {Object} Validated data or throws ZodError
 */
export function parseValidated(schema, data) {
    return schema.parse(data)
}
