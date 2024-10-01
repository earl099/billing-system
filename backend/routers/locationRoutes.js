const locationController = require('../controllers/locationController')
const router = require('express').Router()

router.post('/add-location', locationController.addLoc)

router.get('/get-locations', locationController.getLocs)

module.exports = router
