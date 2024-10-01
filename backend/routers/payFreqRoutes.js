const payFreqController = require('../controllers/payFreqController')
const router = require('express').Router()

router.post('/add-payFreq', payFreqController.addPayFreq)

router.get('/get-payFreqs', payFreqController.getPayFreqs)

module.exports = router
