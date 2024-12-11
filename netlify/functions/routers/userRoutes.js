const userController = require('../controllers/userController')
const router = require('express').Router()

//SIGN UP ROUTE
router.post('/signup', userController.addUser)

//GET USERS ROUTE
router.get('/get-users/:offset/:limit', userController.getUsers)
router.get('/get-users', userController.getUsers)

//GET USER ROUTE
router.get('/get-user/:id', userController.getUser)

//LOGIN ROUTE
router.post('/login', userController.login)

//EDIT DETAILS ROUTE
router.put('/edit-details/:id', userController.editDetails)

//EDIT ACCESS ROUTE
router.put('/edit-access/:id', userController.editAccess)

//DELETE USER ROUTE
router.delete('/delete-user/:id', userController.delUser)

module.exports = router
