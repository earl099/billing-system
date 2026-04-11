import { authMiddleware } from "#middleware/auth.middleware.js";
import {
    createSpadBillingLetter,
    createWordBillingLetter,
    exportToPdf,
    getManpower,
    listManpower,
    listTemplates
} from "#utils/graphClient.js";
import { Router } from "express";

const graphRouter = Router()

graphRouter.use(authMiddleware)

//BILLING LETTER FUNCTIONS
graphRouter.get('/editor/templates/:code', listTemplates)
graphRouter.post('/editor/create/:code/word', createWordBillingLetter)
graphRouter.post('/editor/create/:code/excel', createSpadBillingLetter)
graphRouter.get('/editor/export/:id', exportToPdf)

//MANPOWER FUNCTIONS
graphRouter.get('/manpower/:code/list', listManpower)
graphRouter.get('/manpower/:code/:index', getManpower)

export default graphRouter