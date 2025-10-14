import express from 'express'
import userController from '../controllers/user.controller.js'

const userRouter = express.Router()

userRouter.post('/user/signup', userController.Signup)

userRouter.post('/user/login', userController.Login)

userRouter.post('/user/logout', userController.Logout)

userRouter.get('/user', userController.getUsers)

userRouter.get('/user/:_id', userController.getUser)

userRouter.put('/user/:_id', userController.updateUser)

userRouter.delete('/user/:_id', userController.deleteUser)

export default userRouter