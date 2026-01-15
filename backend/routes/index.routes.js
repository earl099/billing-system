import authRouter from "#routes/auth.routes.js";
import clientRouter from "#routes/client.routes.js";
import logRouter from "#routes/log.routes.js";
import payFreqRouter from "#routes/payfreq.routes.js";
import signupRouter from "#routes/signup.routes.js";
import userRouter from "#routes/user.routes.js";
import acidRouter from "#routes/acid.routes.js";

const ALL_ROUTES = [
    signupRouter,
    logRouter,
    authRouter,
    userRouter,
    payFreqRouter,
    clientRouter,
    acidRouter
]

export default ALL_ROUTES