import authRouter from "./auth.routes.js";
import clientRouter from "./client.routes.js";
import logRouter from "./log.routes.js";
import payFreqRouter from "./payfreq.routes.js";
import signupRouter from "./signup.routes.js";
import userRouter from "./user.routes.js";

const ALL_ROUTES = [
    signupRouter,
    logRouter,
    authRouter,
    userRouter,
    payFreqRouter,
    clientRouter
]

export default ALL_ROUTES