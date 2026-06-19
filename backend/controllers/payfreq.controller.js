/**
 * @fileoverview Pay frequency controller
 * Handles CRUD operations for pay frequency configurations
 */

import payFreqModel from '#models/payfreq.model.js'

/**
 * Gets all pay frequencies
 * Automatically creates a default "ALL" pay frequency if none exist
 * 
 * @param {import('express').Request} _req - Express request (unused)
 * @param {import('express').Response} res - Response with { payFreqs[], total }
 */
export async function getPayFreqs(_req, res) {
    try {
        const payFreqs = await payFreqModel.find()
        const total = await payFreqModel.countDocuments()

        // Ensure default "ALL" pay frequency exists
        if(payFreqs.length < 1) {
            const payFreqObj = { payType: 'ALL' }
            await payFreqModel.create(payFreqObj)
        }

        res.json({ payFreqs, total })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Creates a new pay frequency
 * 
 * @param {import('express').Request} req - Request with body: { payType }
 * @param {import('express').Response} res - Response with { payFreq }
 */
export async function createPayFreq(req, res) {
    try {
        const { payType } = req.body
        const payFreq = await payFreqModel.create({ payType })

        res.status(200).json({ payFreq })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Deletes a pay frequency by ID
 * 
 * @param {import('express').Request} req - Request with params: { _id }
 * @param {import('express').Response} res - Response with success message
 */
export async function deletePayFreq(req, res) {
    try {
        const payFreq = await payFreqModel.findByIdAndDelete({ _id: req.params._id })
        if(!payFreq) return res.status(404).json({ message: 'Pay Frequency not found' })

        res.json({ message: 'Pay Frequency deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}
