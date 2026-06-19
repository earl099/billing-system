/**
 * @fileoverview MongoDB ObjectId validation middleware
 * Validates that route parameters contain valid MongoDB ObjectId strings
 * before they reach the controller layer
 */

import { isValidObjectId } from 'mongoose'

/**
 * Creates middleware that validates a named route parameter is a valid MongoDB ObjectId
 * Returns a 400 error if the parameter is missing or malformed
 * 
 * @param {string} [paramName='_id'] - Name of the route parameter to validate
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/users/:userId', validateObjectIdParam('userId'), userController.get)
 * router.get('/items/:_id', validateObjectIdParam(), itemController.get)
 */
export function validateObjectIdParam(paramName = '_id') {
    return (req, res, next) => {
        const id = req.params[paramName]

        if (!id) {
            return res.status(400).json({ message: `Missing ${paramName} parameter` })
        }

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: `Invalid ${paramName} format` })
        }

        next()
    }
}
