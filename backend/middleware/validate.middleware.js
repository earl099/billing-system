/**
 * @fileoverview Zod schema validation middleware
 * Provides middleware factories for validating request bodies against Zod schemas
 * with consistent error response formatting
 */

import { ZodError } from 'zod'

/**
 * Creates Express middleware that validates req.body against a Zod schema
 * On success, replaces req.body with the parsed/validated data.
 * On failure, returns a 400 response with field-level error details.
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate the request body against
 * @returns {Function} Express middleware function
 * 
 * @example
 * const createSchema = z.object({ name: z.string(), email: z.string().email() })
 * router.post('/users', validate(createSchema), userController.create)
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
 * Validates data against a Zod schema outside of middleware context
 * Useful for validating data within controller logic or service functions
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {*} data - Data to validate
 * @returns {*} Parsed and validated data
 * @throws {ZodError} If validation fails
 */
export function parseValidated(schema, data) {
    return schema.parse(data)
}
