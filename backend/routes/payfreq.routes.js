/**
 * @fileoverview Pay frequency routes
 * Defines CRUD endpoints for pay frequency configurations
 * All routes require authentication and Admin role
 */

import { Router } from "express";
import { authMiddleware } from "#middleware/auth.middleware.js";
import { adminMiddleware } from "#middleware/admin.middleware.js";
import { validateObjectIdParam } from "#middleware/validateObjectId.middleware.js";
import { getPayFreqs, createPayFreq, deletePayFreq } from '#controllers/payfreq.controller.js'

const payFreqRouter = Router()

/** Apply auth + admin middleware to all pay frequency routes */
payFreqRouter.use(authMiddleware, adminMiddleware)

/** GET /payfreq - List all pay frequencies */
payFreqRouter.get('/payfreq', getPayFreqs)
/** POST /payfreq - Create new pay frequency */
payFreqRouter.post('/payfreq', createPayFreq)
/** DELETE /payfreq/:_id - Delete pay frequency by ID */
payFreqRouter.delete('/payfreq/:_id', validateObjectIdParam('_id'), deletePayFreq)

export default payFreqRouter
