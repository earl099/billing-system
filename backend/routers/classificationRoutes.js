const classificationController = require('../controllers/classificationController')
const router = require('express').Router()

router.post('/add-class', classificationController.addClass)

router.get('/get-class', classificationController.getClass)

module.exports = router
