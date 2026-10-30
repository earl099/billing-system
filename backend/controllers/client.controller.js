/**
 * @fileoverview Client controller
 * Handles CRUD operations for client organizations
 */

import clientModel from '#models/client.model.js';
import payFreqModel from '#models/payfreq.model.js';
import userModel from '#models/user.model.js';

/** Returns public signup options without exposing system placeholder clients. */
export async function getSignupOptions(_req, res) {
    try {
        const [clients, admin] = await Promise.all([
            clientModel.find({ code: { $nin: ['ALL', 'NONE'] } }).select('_id code name').sort({ name: 1 }),
            userModel.exists({ role: 'Admin' })
        ])
        res.json({ clients, hasAdmin: Boolean(admin) })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Gets all clients
 * Automatically creates a default "ALL" client if none exist
 * 
 * @param {import('express').Request} _req - Express request (unused)
 * @param {import('express').Response} res - Response with { clients[], total }
 */
export async function getClients(_req, res) {
    try {
        const clients = await clientModel.find()
        const total = await clientModel.countDocuments()

        // Ensure default "ALL" client exists
        if(clients.length < 1) {
            const payFreq = await payFreqModel.findOne({ payType: 'ALL' })
            const clientObj = {
                code: 'ALL',
                name: 'All Clients',
                payFreq: payFreq._id
            }

            await clientModel.create(clientObj)
        }

        res.json({ clients, total })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

export async function getAccessibleClients(req, res) {
    try {
        const filter = req.user.role === 'Admin'
            ? {}
            : { _id: { $in: req.user.handledClients } }
        const clients = await clientModel.find(filter)
        res.json({ clients, total: clients.length })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Gets a single client by ID
 * 
 * @param {import('express').Request} req - Request with params: { _id }
 * @param {import('express').Response} res - Response with { client, message }
 */
export async function getClient(req, res) {
    try {
        const client = await clientModel.findById(req.params._id)
        if(!client) return res.status(404).json({ message: 'Client not found' })

        res.json({ client, message: 'Client found' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Creates a new client
 * 
 * @param {import('express').Request} req - Request with body: { code, name, payFreq }
 * @param {import('express').Response} res - Response with { client }
 */
export async function createClient(req, res) {
    try {
        const { code, name, payFreq } = req.body
        const normalizedPayFreq = Array.isArray(payFreq) ? payFreq : [payFreq]
        const client = await clientModel.create({ code, name, payFreq: normalizedPayFreq })
        res.json({ client })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Updates an existing client
 * 
 * @param {import('express').Request} req - Request with params: { _id }, body: { code, name, payFreq }
 * @param {import('express').Response} res - Response with { client }
 */
export async function updateClient(req, res) {
    try {
        const { code, name, payFreq } = req.body
        const update = {}

        if (code !== undefined) update.code = code
        if (name !== undefined) update.name = name
        if (payFreq !== undefined) {
            update.payFreq = Array.isArray(payFreq) ? payFreq : [payFreq]
        }

        const client = await clientModel.findByIdAndUpdate(req.params._id, update, { new: true, runValidators: true })
        if(!client) return res.status(404).json({ message: 'Client not found' })
        res.json({ client })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Deletes a client by ID
 * 
 * @param {import('express').Request} req - Request with params: { _id }
 * @param {import('express').Response} res - Response with success message
 */
export async function deleteClient(req, res) {
    try {
        const client = await clientModel.findByIdAndDelete(req.params._id)
        if(!client) return res.status(404).json({ message: 'Client not found' })
        res.json({ message: 'Client deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}
