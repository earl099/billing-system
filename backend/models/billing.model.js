/**
 * @fileoverview Billing model for tracking billing operations
 * Stores references to generated billing letters, attachments, and final PDFs
 */

import { Schema, model } from 'mongoose'

/**
 * @typedef {Object} Billing
 * @property {string} client - Client identifier
 * @property {string} billingLetter - Reference to the billing letter document
 * @property {string[]} attachments - Array of attachment file references
 * @property {{ secure_url: string, public_id: string }} finalPdf - Cloudinary reference for the final generated PDF
 * @property {import('mongoose').ObjectId} createdBy - Reference to the User who created this billing
 * @property {Date} createdAt - Timestamp of creation
 */
const billingSchema = new Schema({
    client: String,
    billingLetter: String,
    attachments: [String],
    finalPdf: { secure_url: String, public_id: String },
    createdBy:{ type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
})

const billingModel = model('Billing', billingSchema)

export default billingModel
