import { Router } from "express";
import { createLog, deleteLog, getLog, getLogs } from '#controllers/log.controller.js';
import { authMiddleware } from '#middleware/auth.middleware.js';
import { adminMiddleware } from '#middleware/admin.middleware.js';

const logRouter = Router()

logRouter.get('/log', authMiddleware, adminMiddleware, getLogs)
logRouter.get('/log/:_id', authMiddleware, adminMiddleware, getLog)
logRouter.post('/log', authMiddleware, createLog)
logRouter.delete('/log/:_id', authMiddleware, adminMiddleware, deleteLog)

export default logRouter