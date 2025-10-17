import { Router } from "express";
import payFreqController from '../controllers/payFreq.controller.js';

const payFreqRouter = Router()

payFreqRouter.post('/payfreq', payFreqController.createPayFreq)

payFreqRouter.get('/payfreq', payFreqController.getPayFreqs)

payFreqRouter.get('/payfreq/:_id', payFreqController.getPayFreq)

payFreqRouter.put('/payfreq/:_id', payFreqController.updatePayFreq)

payFreqRouter.delete('/payfreq/:_id', payFreqController.deletePayFreq)

export default payFreqRouter