const employeeController = require('../controllers/employeeController')
const router = require('express').Router()

router.post('/add-employee', employeeController.addEmployee)

router.get('/get-employees', employeeController.getEmployees)
router.get('/get-employees/:offset/:limit', employeeController.getEmployees)

router.get('/get-employee/:id', employeeController.getEmployee)

router.put('/edit-employee/:id', employeeController.editEmployee)

router.delete('/delete-employee/:id', employeeController.delEmployee)

module.exports = router
