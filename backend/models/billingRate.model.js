/**
 * @fileoverview BillingRate model for position salary rate definitions
 * Stores rate configurations used across billing templates
 */

import { Schema, model } from "mongoose";

/**
 * @typedef {Object} BillingRate
 * @property {string} posCode - Unique position code identifier
 * @property {string} posName - Position name/title
 * @property {number} salaryWage - Base salary or wage amount
 * @property {number} dailyRate - Computed daily rate
 * @property {number} monthlyRate - Computed monthly rate
 * @property {number} semiMonthlyRate - Computed semi-monthly rate
 */
const billingRateSchema = Schema({
    posCode: { type: String, required: true, unique: true },
    posName: { type: String, required: true },
    salaryWage: { type: Number, required: true },
    dailyRate: { type: Number, required: true },
    monthlyRate: { type: Number, required: true },
    semiMonthlyRate: { type: Number, required: true }
})

const billingRateModel = model('BillingRate', billingRateSchema)

export default billingRateModel
