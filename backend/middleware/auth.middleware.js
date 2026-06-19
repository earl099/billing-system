/**
 * @fileoverview JWT authentication middleware
 * Verifies JWT tokens from the Authorization header and attaches decoded user info to the request
 */

import jwt from 'jsonwebtoken';

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
export function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization']
    if(!authHeader) return res.status(401).json({ message: 'Missing token' });

    const token = authHeader.split(' ')[1]
    if(!token) return res.status(401).json({ message: 'Invalid token format' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        
        // Validate required fields in token
        if (!decoded.id || !decoded.username) {
            return res.status(401).json({ message: 'Invalid token structure' })
        }
        
        req.user = decoded
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' })
        }
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}
