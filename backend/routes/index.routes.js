import clientRouter from "./client.routes.js";
import logRouter from "./log.routes.js";
import userRouter from "./user.routes.js";

const ALL_ROUTES =  [
    logRouter,
    userRouter,
    clientRouter
]

export default ALL_ROUTES