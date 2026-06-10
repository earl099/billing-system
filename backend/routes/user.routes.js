import { Router } from 'express'
import { adminMiddleware } from '#middleware/admin.middleware.js'
import { authMiddleware } from '#middleware/auth.middleware.js'
import { validate } from '#middleware/validate.middleware.js'
import { validateObjectIdParam } from '#middleware/validateObjectId.middleware.js'
import { createUserSchema, updateUserSchema } from '#utils/validation.util.js'
import { createUser, deleteUser, getUser, getUsers, updateUser } from '#controllers/user.controller.js'

const userRouter = Router()

//Admin-protected routes
userRouter.use(authMiddleware, adminMiddleware)

userRouter.get('/user', getUsers)
userRouter.get('/user/:_id', validateObjectIdParam('_id'), getUser)
userRouter.post('/user', validate(createUserSchema), createUser)
userRouter.put('/user/:_id', validateObjectIdParam('_id'), validate(updateUserSchema), updateUser)
userRouter.delete('/user/:_id', validateObjectIdParam('_id'), deleteUser)

export default userRouter
