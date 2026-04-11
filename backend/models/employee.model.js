import { Schema, model } from "mongoose";

const status = ['Active', 'Inactive']

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