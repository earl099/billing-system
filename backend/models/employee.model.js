/**
 * @fileoverview Employee model for managing employee records within billing contexts
 * Stores employee details, compensation info, and government ID numbers
 */

import { Schema, model } from "mongoose";

/** @type {string[]} Valid employee status values */
const status = ['Active', 'Inactive']

/**
 * @typedef {Object} Employee
 * @property {string} billingId - Associated billing identifier
 * @property {import('mongoose').ObjectId[]} client - References to associated Client documents
 * @property {string} empNo - Unique employee number
 * @property {string} empName - Employee full name
 * @property {string} posCode - Position code reference
 * @property {string} dept - Department assignment
 * @property {'Active'|'Inactive'} status - Employee status (default: 'Active')
 * @property {string} type - Employee type (default: 'CP')
 * @property {string} payType - Payment type (default: 'Semi-monthly')
 * @property {string} payFreq - Pay frequency
 * @property {string} tin - Tax Identification Number
 * @property {string} sssNo - SSS number
 * @property {string} phNo - PhilHealth number
 * @property {string} hdmfNo - Pag-IBIG/HDMF number
 * @property {string} hd - HD classification (default: 'C')
 * @property {number} mfoptAmt - MFOPT amount (default: 200)
 * @property {number} salaryWageAmt - Salary/wage amount
 * @property {string} bankAcctNo - Bank account number
 */
const employeeSchema = Schema({
    billingId: { type: String, required: true },
    client: { type: [Schema.Types.ObjectId], ref: 'Client' },

    empNo: { type: String, required: true, unique: true },
    empName: String,
    posCode: String,
    dept: String,
    status: { type: String, enum: status, default: 'Active' },
    type: { type: String, default: 'CP' },
    payType: { type: String, default: 'Semi-monthly' },
    payFreq: String,
    tin: String,
    sssNo: String,
    phNo: String,
    hdmfNo: String,
    hd: { type: String, default: 'C' },
    mfoptAmt: { type: Number, default: 200 },
    salaryWageAmt: Number,
    bankAcctNo: String
})

const employeeModel = model('Employee', employeeSchema)

export default employeeModel
