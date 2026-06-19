/**
 * @fileoverview Client routes
 * Defines CRUD endpoints for client organizations
 * All routes require authentication and Admin role
 */

import { Router } from "express";
import { authMiddleware } from "#middleware/auth.middleware.js";
import { adminMiddleware } from "#middleware/admin.middleware.js";
import { validate } from "#middleware/validate.middleware.js";
import { validateObjectIdParam } from "#middleware/validateObjectId.middleware.js";
import { createClientSchema, updateClientSchema } from "#utils/validation.util.js";
import { createClient, deleteClient, getClient, getClients, updateClient } from "#controllers/client.controller.js";

const clientRouter = Router()

/** Apply auth + admin middleware to all client routes */
clientRouter.use(authMiddleware, adminMiddleware)

/** GET /client - List all clients */
clientRouter.get('/client', getClients)
/** GET /client/:_id - Get single client by ID */
clientRouter.get('/client/:_id', validateObjectIdParam('_id'), getClient)
/** POST /client - Create new client (validated) */
clientRouter.post('/client', validate(createClientSchema), createClient)
/** PUT /client/:_id - Update client (validated) */
clientRouter.put('/client/:_id', validateObjectIdParam('_id'), validate(updateClientSchema), updateClient)
/** DELETE /client/:_id - Delete client by ID */
clientRouter.delete('/client/:_id', validateObjectIdParam('_id'), deleteClient)

export default clientRouter
