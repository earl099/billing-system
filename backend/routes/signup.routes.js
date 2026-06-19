/**
 * @fileoverview Signup data routes
 * Provides public-access endpoints for fetching pay frequencies and clients
 * during the registration flow
 */

import { Router } from "express";
import { getPayFreqs } from "#controllers/payfreq.controller.js";
import { getClients } from '#controllers/client.controller.js';

const signupRouter = Router()

/** GET /payfreq/list - List available pay frequencies (for signup form) */
signupRouter.get('/payfreq/list', getPayFreqs)
/** GET /client/list - List available clients (for signup form) */
signupRouter.get('/client/list', getClients)

export default signupRouter
