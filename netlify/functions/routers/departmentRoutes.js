const departmentController = require('../controllers/departmentController')
const router = require('express').Router()

router.post('/add-dept', departmentController.addDept)

router.get('/get-depts', departmentController.getDepts)
router.get('/get-depts/:offset/:limit', departmentController.getDepts)

router.get('/get-dept/:id', departmentController.getDept)

router.put('/edit-dept/:id', departmentController.editDept)

router.delete('/delete-dept/:id', departmentController.delDept)

module.exports = router
