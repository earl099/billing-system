/**
 * @fileoverview Signup data routes
 * Provides public-access endpoints for fetching pay frequencies and clients
 * during the registration flow
 */

import { Router } from "express";
import { getPayFreqs } from "#controllers/payfreq.controller.js";
import { getAccessibleClients, getSignupOptions } from '#controllers/client.controller.js';
import { authMiddleware } from '#middleware/auth.middleware.js';
import { adminMiddleware } from '#middleware/admin.middleware.js';

const signupRouter = Router()

/** GET /signup/options - Public client and administrator status for registration */
signupRouter.get('/signup/options', getSignupOptions)
/** GET /payfreq/list - List pay frequencies (Admin only) */
signupRouter.get('/payfreq/list', authMiddleware, adminMiddleware, getPayFreqs)
/** GET /client/list - List only the clients available to the authenticated user */
signupRouter.get('/client/list', authMiddleware, getAccessibleClients)

export default signupRouter
