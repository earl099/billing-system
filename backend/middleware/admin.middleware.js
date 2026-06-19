/**
 * @fileoverview Admin authorization middleware
 * Restricts access to admin-only routes by verifying the user's role
 */

/**
 * Express middleware that checks if the authenticated user has Admin role
 * Must be used after authMiddleware so req.user is populated
 * 
 * @param {import('express').Request} req - Express request object (requires req.user from authMiddleware)
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void} Returns 401 if unauthenticated, 403 if non-admin, or proceeds to next middleware
 */
export function adminMiddleware(req, res, next) {
    if(!req.user) return res.status(401).json({ message: 'Missing auth' });
    if(req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized access' });
    next();
}
