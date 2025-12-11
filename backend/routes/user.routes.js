import { Router } from 'express'
import { adminMiddleware } from '../middleware/admin.middleware.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createUser, deleteUser, getUser, getUsers, updateUser } from '../controllers/user.controller.js'

const userRouter = Router()

//Admin-protected routes
userRouter.use(authMiddleware, adminMiddleware)

userRouter.get('/user', getUsers)
userRouter.get('/user/:_id', getUser)
userRouter.post('/user', createUser)
userRouter.put('/user/:_id', updateUser)
userRouter.delete('/user/:_id', deleteUser)

export default userRouter