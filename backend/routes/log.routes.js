/**
 * @fileoverview Audit log routes
 * Defines CRUD endpoints for audit log entries
 * Read and delete operations require Admin role; create requires authentication only
 */

import { Router } from "express";
import { createLog, deleteLog, getLog, getLogs } from '#controllers/log.controller.js';
import { authMiddleware } from '#middleware/auth.middleware.js';
import { adminMiddleware } from '#middleware/admin.middleware.js';

const logRouter = Router()

/** GET /log - List all audit logs (Admin only) */
logRouter.get('/log', authMiddleware, adminMiddleware, getLogs)
/** GET /log/:_id - Get single log entry (Admin only) */
logRouter.get('/log/:_id', authMiddleware, adminMiddleware, getLog)
/** POST /log - Create audit log entry (authenticated users) */
logRouter.post('/log', authMiddleware, createLog)
/** DELETE /log/:_id - Delete log entry (Admin only) */
logRouter.delete('/log/:_id', authMiddleware, adminMiddleware, deleteLog)

export default logRouter
