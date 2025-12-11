export function adminMiddleware(req, res, next) {
    if(!req.user) return res.status(401).json({ message: 'Missing auth' });
    if(req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized access' });
    next();
}