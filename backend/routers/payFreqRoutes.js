const payFreqController = require('../controllers/payFreqController')
const router = require('express').Router()

router.post('/add-payFreq', payFreqController.addPayFreq)

router.get('/get-payFreqs', payFreqController.getPayFreqs)

router.get('/get-payFreq/:id', payFreqController.getPayFreq)

router.put('/edit-pay-freq/:id', payFreqController.editPayFreq)

router.delete('/delete-pay-freq/:id', payFreqController.deletePayFreq)

module.exports = router
