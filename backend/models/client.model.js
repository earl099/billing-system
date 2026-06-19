/**
 * @fileoverview Client model for managing client organizations
 * Stores client details and associated pay frequency configurations
 */

import { Schema, model } from "mongoose";

/**
 * @typedef {Object} Client
 * @property {string} code - Unique client code (indexed for fast lookups)
 * @property {string} name - Unique client name
 * @property {import('mongoose').ObjectId[]} payFreq - References to associated PayFreq documents
 * @property {Date} createdAt - Auto-managed creation timestamp
 * @property {Date} updatedAt - Auto-managed update timestamp
 */
const clientSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    payFreq: {
        type: [Schema.Types.ObjectId],
        ref: 'PayFreq'
    }
}, { timestamps: true })

const clientModel = model('Client', clientSchema)

export default clientModel
