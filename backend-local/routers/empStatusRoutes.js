const empStatusController = require('../controllers/empStatusController')
const router = require('express').Router()

router.post('/add-emp-status', empStatusController.addEmpStatus)

router.get('/get-emp-statuses', empStatusController.getEmpStatuses)
router.get('/get-emp-statuses/:offset/:limit', empStatusController.getEmpStatuses)

router.get('/get-emp-status/:id', empStatusController.getEmpStatus)

router.put('/edit-emp-status/:id', empStatusController.editEmpStatus)

router.delete('/delete-emp-status/:id', empStatusController.delEmpStatus)

module.exports = router
