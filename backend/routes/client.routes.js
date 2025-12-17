import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import { createClient, deleteClient, getClient, getClients, updateClient } from "../controllers/client.controller.js";

const clientRouter = Router()

clientRouter.use(authMiddleware, adminMiddleware)

clientRouter.get('/client', getClients)
clientRouter.get('/client/:_id', getClient)
clientRouter.post('/client', createClient)
clientRouter.put('/client/:_id', updateClient)
clientRouter.delete('/client/:_id', deleteClient)

export default clientRouter