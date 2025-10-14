import express from "express";
import logController from "../controllers/log.controller.js";

const logRouter = express.Router()

logRouter.post('/log', logController.createLog)

logRouter.get('/log', logController.getLogs)

export default logRouter