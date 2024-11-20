const formerEmpController = require('../controllers/formerEmpController')
const router = require('express').Router()

router.post('/add-former-emp', formerEmpController.addFormerEmp)

router.get('/get-former-emps', formerEmpController.getFormerEmps)
router.get('/get-former-emps/:offset/:limit', formerEmpController.getFormerEmps)

router.get('/get-former-emp/:id', formerEmpController.getFormerEmp)

router.put('/edit-former-emp/:id', formerEmpController.editFormerEmp)

router.delete('/delete-former-emp/:id', formerEmpController.delFormerEmp)

module.exports = router
