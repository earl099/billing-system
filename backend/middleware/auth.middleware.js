/**
 * @fileoverview JWT authentication middleware
 * Verifies JWT tokens from the Authorization header and attaches decoded user info to the request
 */

import jwt from 'jsonwebtoken';
import userModel from '#models/user.model.js'

/** @type {string} JWT signing secret from environment variables */
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required')
}

/**
 * Express middleware that validates JWT Bearer tokens
 * Extracts token from "Authorization: Bearer <token>" header, verifies it,
 * and attaches the decoded payload (containing id and username) to req.user
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void} Returns 401 on missing/invalid/expired token, or proceeds to next middleware
 */
export async function authMiddleware(req, res, next) {
    let token = null
    const authHeader = req.headers['authorization']
    if (authHeader) {
        const [scheme, headerToken, ...extra] = authHeader.split(' ')
        if (scheme !== 'Bearer' || !headerToken || extra.length) {
            return res.status(401).json({ message: 'Invalid token format' })
        }
        token = headerToken
    } else if (req.cookies && req.cookies.app_token) {
        token = req.cookies.app_token
    }

    if (!token) return res.status(401).json({ message: 'Missing token' })

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        
        if (typeof decoded === 'string' || !decoded.id) {
            return res.status(401).json({ message: 'Invalid token structure' })
        }

        const user = await userModel.findById(decoded.id).select('_id username name email role handledClients')
        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        req.user = user
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' })
        }
        if (error.name !== 'JsonWebTokenError' && error.name !== 'NotBeforeError') {
            return next(error)
        }
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}
