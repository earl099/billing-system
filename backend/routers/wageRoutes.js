const wageController = require('../controllers/wageController')
const router = require('express').Router()

router.post('/add-wage', wageController.addWage)

router.get('/get-wages/:offset/:limit', wageController.getWages)
router.get('/get-wages', wageController.getWages)

router.get('/get-wage/:id', wageController.getWage)

router.put('/edit-wage/:id', wageController.editWage)

router.delete('/delete-wage/:id', wageController.delWage)

module.exports = router
