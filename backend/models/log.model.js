/**
 * @fileoverview Log model for audit trail tracking
 * Records user operations for accountability and auditing purposes
 */

import { Schema, model } from "mongoose";

/**
 * @typedef {Object} Log
 * @property {string} operation - Description of the operation performed
 * @property {string} user - Username of the user who performed the operation
 * @property {Date} createdAt - Auto-managed creation timestamp
 * @property {Date} updatedAt - Auto-managed update timestamp
 */
const logSchema = new Schema({
    operation: { type: String },
    user: { type: String }
}, { timestamps: true })

const logModel = model('Log', logSchema)

export default logModel
