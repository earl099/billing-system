import { Router } from "express";
import { getPayFreqs } from "#controllers/payfreq.controller.js";
import { getClients } from '#controllers/client.controller.js';
import { authMiddleware } from "#middleware/auth.middleware.js";

const signupRouter = Router()

signupRouter.get('/payfreq/list', getPayFreqs)
signupRouter.get('/client/list', getClients)

export default signupRouter
