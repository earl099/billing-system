const positionController = require('../controllers/positionController')
const router = require('express').Router()

router.post('/add-position', positionController.addPosition)

router.get('/get-positions', positionController.getPositions)
router.get('/get-positions/:offset/:limit', positionController.getPositions)

router.get('/get-position/:id', positionController.getPosition)

router.put('/edit-position/:id', positionController.editPosition)

router.delete('/delete-position/:id', positionController.delPosition)

module.exports = router
