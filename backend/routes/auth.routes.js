import { Router } from "express";
import { login, me, signup } from "#controllers/auth.controller.js";
import { authMiddleware } from "#middleware/auth.middleware.js";
import { validate } from "#middleware/validate.middleware.js";
import { authLimiter } from "#middleware/rateLimit.middleware.js";
import { signupSchema, loginSchema } from "#utils/validation.util.js";

const authRouter = Router()

authRouter.post('/auth/signup', authLimiter, validate(signupSchema), signup)
authRouter.post('/auth/login', authLimiter, validate(loginSchema), login)
authRouter.get('/auth/me', authMiddleware, me)

export default authRouter
