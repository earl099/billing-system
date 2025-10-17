import clientRouter from "./client.routes.js";
import logRouter from "./log.routes.js";
import payFreqRouter from "./payFreq.routes.js";
import userRouter from "./user.routes.js";

const ALL_ROUTES =  [
    logRouter,
    userRouter,
    clientRouter,
    payFreqRouter
]

export default ALL_ROUTES