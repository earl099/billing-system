import { authMiddleware } from "#middleware/auth.middleware.js";
import { createBillingLetter, exportToPdf, listTemplates } from "#utils/graphClient.js";
import { Router } from "express";

const graphRouter = Router()

graphRouter.use(authMiddleware)

graphRouter.get('/word/templates', listTemplates)
graphRouter.post('/word/create', createBillingLetter)
graphRouter.get('/word/export/:id', exportToPdf)

export default graphRouter