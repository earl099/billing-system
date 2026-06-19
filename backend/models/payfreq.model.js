/**
 * @fileoverview PayFreq model for pay frequency configuration
 * Defines available pay frequency types (e.g., weekly, semi-monthly, monthly)
 */

import { Schema, model } from "mongoose";

/**
 * @typedef {Object} PayFreq
 * @property {string} payType - Pay frequency type name
 */
const payFreqSchema = new Schema({ payType: String })

const payFreqModel = model('PayFreq', payFreqSchema)

export default payFreqModel
