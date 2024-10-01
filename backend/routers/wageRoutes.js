const wageController = require('../controllers/wageController')
const router = require('express').Router()

router.post('/add-wage', wageController.addWage)

router.get('get-wages', wageController.getWages)

module.exports = router
