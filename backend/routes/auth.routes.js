import { Router } from "express";
import { login, me, signup } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const authRouter = Router()

authRouter.post('/auth/signup', signup)
authRouter.post('/auth/login', login)
authRouter.get('/auth/me', authMiddleware, me)

export default authRouter