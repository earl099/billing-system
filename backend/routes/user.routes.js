/**
 * @fileoverview User management routes
 * Defines CRUD endpoints for user accounts (admin management)
 * All routes require authentication and Admin role
 */

import { Router } from 'express'
import { adminMiddleware } from '#middleware/admin.middleware.js'
import { authMiddleware } from '#middleware/auth.middleware.js'
import { validate } from '#middleware/validate.middleware.js'
import { validateObjectIdParam } from '#middleware/validateObjectId.middleware.js'
import { createUserSchema, updateUserSchema } from '#utils/validation.util.js'
import { createUser, deleteUser, getUser, getUsers, updateUser } from '#controllers/user.controller.js'

const userRouter = Router()

/** Apply auth + admin middleware to all user management routes */
userRouter.use(authMiddleware, adminMiddleware)

/** GET /user - List all users */
userRouter.get('/user', getUsers)
/** GET /user/:_id - Get single user by ID */
userRouter.get('/user/:_id', validateObjectIdParam('_id'), getUser)
/** POST /user - Create new user (validated) */
userRouter.post('/user', validate(createUserSchema), createUser)
/** PUT /user/:_id - Update user (validated) */
userRouter.put('/user/:_id', validateObjectIdParam('_id'), validate(updateUserSchema), updateUser)
/** DELETE /user/:_id - Delete user by ID */
userRouter.delete('/user/:_id', validateObjectIdParam('_id'), deleteUser)

export default userRouter
