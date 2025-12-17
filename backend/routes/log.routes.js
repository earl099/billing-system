import { Router } from "express";
import { createLog, deleteLog, getLog, getLogs } from '../controllers/log.controller.js';

const logRouter = Router()

logRouter.get('/log', getLogs)
logRouter.get('/log/:_id', getLog)
logRouter.post('/log', createLog)
logRouter.delete('/log/:_id', deleteLog)

export default logRouter