import { Router } from "express";
import { authMiddleware } from "#middleware/auth.middleware.js";
import { adminMiddleware } from "#middleware/admin.middleware.js";
import { validateObjectIdParam } from "#middleware/validateObjectId.middleware.js";
import { getPayFreqs, createPayFreq, deletePayFreq } from '#controllers/payfreq.controller.js'

const payFreqRouter = Router()

payFreqRouter.use(authMiddleware, adminMiddleware)

payFreqRouter.get('/payfreq', getPayFreqs)
payFreqRouter.post('/payfreq', createPayFreq)
payFreqRouter.delete('/payfreq/:_id', validateObjectIdParam('_id'), deletePayFreq)

export default payFreqRouter
