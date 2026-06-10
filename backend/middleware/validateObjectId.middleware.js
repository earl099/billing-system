import { isValidObjectId } from 'mongoose'

export function validateObjectIdParam(paramName = '_id') {
    return (req, res, next) => {
        const id = req.params[paramName]

        if (!id) {
            return res.status(400).json({ message: `Missing ${paramName} parameter` })
        }

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: `Invalid ${paramName} format` })
        }

        next()
    }
}
