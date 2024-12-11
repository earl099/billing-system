const locationController = require('../controllers/locationController')
const router = require('express').Router()

router.post('/add-location', locationController.addLoc)

router.get('/get-locations', locationController.getLocs)
router.get('/get-locations/:offset/:limit', locationController.getLocs)

router.get('/get-location/:id', locationController.getLoc)

router.put('/edit-location/:id', locationController.editLoc)

router.delete('/delete-location/:id', locationController.delLoc)

module.exports = router
