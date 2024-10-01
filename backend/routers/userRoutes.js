const userController = require('../controllers/userController')
const router = require('express').Router()

router.post('/signup', userController.addUser)

router.get('/get-users', userController.getUsers)

router.get('/get-user/:emailOrUser', userController.getUser)

router.post('/login', userController.login)

module.exports = router
