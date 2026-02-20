import { authMiddleware } from "#middleware/auth.middleware.js";
import { createBillingLetter, exportToPdf, listTemplates } from "#utils/graphClient.js";
import { Router } from "express";

const graphRouter = Router()

graphRouter.use(authMiddleware)

graphRouter.get('/word/templates/:code', listTemplates)
graphRouter.post('/word/create/:code', createBillingLetter)
graphRouter.get('/word/export/:id', exportToPdf)

export default graphRouter