/**
 * @fileoverview Log controller
 * Handles CRUD operations for audit log entries
 */

import logModel from '#models/log.model.js'

/**
 * Gets all audit logs
 * 
 * @param {import('express').Request} _req - Express request (unused)
 * @param {import('express').Response} res - Response with { logs[], total }
 */
export async function getLogs(_req, res) {
    try {
        const logs = await logModel.find()
        const total = await logModel.countDocuments()

        res.json({ logs, total })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Gets a single log entry by ID
 * 
 * @param {import('express').Request} req - Request with params: { _id }
 * @param {import('express').Response} res - Response with { log, message }
 */
export async function getLog(req, res) {
    try {
        const log = await logModel.findById(req.params._id)
        if(!log) return res.status(404).json({ message: 'Log not found' })

        res.status(200).json({ log, message: 'Log found' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Creates a new audit log entry
 * 
 * @param {import('express').Request} req - Request with body: { operation, user }
 * @param {import('express').Response} res - Response with { log }
 */
export async function createLog(req, res) {
    try {
        const { operation, user } = req.body
        const log = await logModel.create({ operation, user })

        res.json({ log })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Deletes a log entry by ID
 * 
 * @param {import('express').Request} req - Request with params: { _id }
 * @param {import('express').Response} res - Response with success message
 */
export async function deleteLog(req, res) {
    try {
        const log = await logModel.findByIdAndDelete(req.params._id)
        if(!log) return res.status(404).json({ message: 'Log not found' })

        res.json({ message: 'Log deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}
