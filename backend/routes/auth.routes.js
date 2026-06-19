/**
 * @fileoverview Authentication routes
 * Defines endpoints for user signup, login, and session validation
 */

import { Router } from "express";
import { login, me, signup } from "#controllers/auth.controller.js";
import { authMiddleware } from "#middleware/auth.middleware.js";
import { validate } from "#middleware/validate.middleware.js";
import { authLimiter } from "#middleware/rateLimit.middleware.js";
import { signupSchema, loginSchema } from "#utils/validation.util.js";

const authRouter = Router()

/** POST /auth/signup - Register new user (rate-limited, validated) */
authRouter.post('/auth/signup', authLimiter, validate(signupSchema), signup)
/** POST /auth/login - Authenticate user (rate-limited, validated) */
authRouter.post('/auth/login', authLimiter, validate(loginSchema), login)
/** GET /auth/me - Get current authenticated user profile */
authRouter.get('/auth/me', authMiddleware, me)

export default authRouter
