/**
 * @fileoverview Route aggregator
 * Imports all route modules and exports them as a single array for registration in the Express app
 */

import authRouter from "#routes/auth.routes.js";
import backupRouter from "#routes/backup.routes.js";
import clientRouter from "#routes/client.routes.js";
import logRouter from "#routes/log.routes.js";
import payFreqRouter from "#routes/payfreq.routes.js";
import signupRouter from "#routes/signup.routes.js";
import userRouter from "#routes/user.routes.js";
import billingRouter from "#routes/billing.routes.js";
import graphRouter from "#routes/graph.routes.js";

/**
 * All application route modules
 * Order matters: public routes first, then authenticated, then admin-only
 * 
 * @type {import('express').Router[]}
 */
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
    backupRouter,
]

export default ALL_ROUTES
