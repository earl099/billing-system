import authRouter from "#routes/auth.routes.js";
import clientRouter from "#routes/client.routes.js";
import logRouter from "#routes/log.routes.js";
import payFreqRouter from "#routes/payfreq.routes.js";
import signupRouter from "#routes/signup.routes.js";
import userRouter from "#routes/user.routes.js";
import billingRouter from "#routes/billing.routes.js";
import graphRouter from "#routes/graph.routes.js";

const ALL_ROUTES = [
    signupRouter,
    logRouter,
    authRouter,
    billingRouter,
    graphRouter,

    //ADMIN ONLY ROUTES
    userRouter,
    payFreqRouter,
    clientRouter,
]

export default ALL_ROUTES