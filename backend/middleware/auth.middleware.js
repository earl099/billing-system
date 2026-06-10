import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required')
}

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