const positionController = require('../controllers/positionController')
const router = require('express').Router()

router.post('/add-position', positionController.addPosition)

router.get('/get-positions', positionController.getPositions)

module.exports = router
