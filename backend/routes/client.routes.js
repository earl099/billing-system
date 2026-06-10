import { Router } from "express";
import { authMiddleware } from "#middleware/auth.middleware.js";
import { adminMiddleware } from "#middleware/admin.middleware.js";
import { validate } from "#middleware/validate.middleware.js";
import { validateObjectIdParam } from "#middleware/validateObjectId.middleware.js";
import { createClientSchema, updateClientSchema } from "#utils/validation.util.js";
import { createClient, deleteClient, getClient, getClients, updateClient } from "#controllers/client.controller.js";

const clientRouter = Router()

clientRouter.use(authMiddleware, adminMiddleware)

clientRouter.get('/client', getClients)
clientRouter.get('/client/:_id', validateObjectIdParam('_id'), getClient)
clientRouter.post('/client', validate(createClientSchema), createClient)
clientRouter.put('/client/:_id', validateObjectIdParam('_id'), validate(updateClientSchema), updateClient)
clientRouter.delete('/client/:_id', validateObjectIdParam('_id'), deleteClient)

export default clientRouter
