const employeeController = require('../controllers/employeeController')
const router = require('express').Router()

router.post('/add-employee', employeeController.addEmployee)

router.get('/get-employees', employeeController.getEmployees)
router.get('/get-employees/:offset/:limit', employeeController.getEmployees)



module.exports = router
