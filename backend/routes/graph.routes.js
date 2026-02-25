import { authMiddleware } from "#middleware/auth.middleware.js";
import { createExcelBillingLetter, createWordBillingLetter, exportToPdf, listTemplates } from "#utils/graphClient.js";
import { Router } from "express";

const graphRouter = Router()

graphRouter.use(authMiddleware)

graphRouter.get('/editor/templates/:code', listTemplates)
graphRouter.post('/editor/create/:code/word', createWordBillingLetter)
graphRouter.post('/editor/create/:code/excel', createExcelBillingLetter)
graphRouter.get('/editor/export/:id', exportToPdf)

export default graphRouter