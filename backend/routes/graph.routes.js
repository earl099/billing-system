import { authMiddleware } from "#middleware/auth.middleware.js";
import {
    addToTable,
    createSpadBillingLetter,
    createWordBillingLetter,
    deleteFromTable,
    exportToPdf,
    getFromTable,
    listData,
    listTemplates,
    updateRow
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
graphRouter.get('/manpower/:code/list', listData)
graphRouter.get('/manpower/:code/:index', getFromTable)
graphRouter.post('/manpower/:code/add', addToTable)
graphRouter.patch('/manpower/:code/:index/edit', updateRow)
graphRouter.delete('/manpower/:code/:index/delete', deleteFromTable)

export default graphRouter
