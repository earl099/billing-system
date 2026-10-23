/**
 * @fileoverview Client-level authorization for routes that identify a client by code.
 */

import clientModel from '#models/client.model.js'

async function authorizeClient(req, res, next, code) {
    try {
        if (!code) {
            return res.status(400).json({ message: 'Client code is required' })
        }

        if (req.user?.role === 'Admin') {
            return next()
        }

        const client = await clientModel.findOne({ code }).select('_id')
        if (!client) {
            return res.status(404).json({ message: 'Client not found' })
        }

        const hasAccess = req.user?.handledClients?.some(
            handledClient => handledClient.toString() === client._id.toString()
        )
        if (!hasAccess) {
            return res.status(403).json({ message: 'Unauthorized client access' })
        }

        next()
    } catch (error) {
        next(error)
    }
}

export function clientAccessMiddleware(req, res, next) {
    return authorizeClient(req, res, next, req.params.code?.toUpperCase())
}

export function requireClientCode(code) {
    return (req, res, next) => authorizeClient(req, res, next, code.toUpperCase())
}
