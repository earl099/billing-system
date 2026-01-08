import { Router } from "express";
import { getPayFreqs } from "../controllers/payfreq.controller.js";
import { getClients } from '../controllers/client.controller.js';
import { getUsers } from '../controllers/user.controller.js';

const signupRouter = Router()


signupRouter.get('/payfreq/list', getPayFreqs)
signupRouter.get('/client/list', getClients)
signupRouter.get('/user/list', getUsers)

export default signupRouter
