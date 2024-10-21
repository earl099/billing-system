const classificationController = require('../controllers/classificationController')
const router = require('express').Router()

router.post('/add-class', classificationController.addClass)

router.get('/get-classes', classificationController.getClasses)
router.get('/get-classes/:offset/:limit', classificationController.getClasses)

router.get('/get-class/:id', classificationController.getClass)

router.put('/edit-class/:id', classificationController.editClass)

router.delete('/delete-class/:id', classificationController.delClass)

module.exports = router
