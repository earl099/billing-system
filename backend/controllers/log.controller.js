import Log from "../models/Log.model.js";
import createError from "../middleware/error-utils.js";

const createLog = (req, res, next) => {
    try {
        const log = new Log({
            operation: req.body.operation,
            user: req.body.user
        })
        return log.save()
        .then(result => {
            res.status(200).json({
                message: 'Operation successful',
                log: result
            })
        })
        .catch(_err => {
            next(createError('Operation creation failed', 500))
        })
    } catch (error) {
        next(error)
    }
}

const getLogs = (req, res, next) => {
    try {
        let fetchedLogs
        const logQuery = Log.find()

        logQuery.then(logs => {
            fetchedLogs = logs
            res.status(200).json({
                message: 'Logs fetched successfully',
                logs: fetchedLogs
            })
        })
        .catch(_err => next(createError('Fetching logs failed', 500)))
    } catch (error) {
        next(error)
    }
}

const logController = { createLog, getLogs }

export default logController