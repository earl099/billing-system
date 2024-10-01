const departmentController = require('../controllers/departmentController')
const router = require('express').Router()

router.post('/add-dept', departmentController.addDept)

router.get('/get-depts', departmentController.getDepts)

module.exports = router
