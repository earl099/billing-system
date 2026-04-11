import { Schema, model } from "mongoose";

const billingRateSchema = Schema({
    client: { type: [Schema.Types.ObjectId], ref: 'Client' },
    posCode: { type: String, required: true, unique: true },
    posName: String,
    dailyRate: Number,
    monthlyRate: Number,
    salaryType: String,
    salaryWage: Number
})

const billingRateModel = model('BillingRate', billingRateSchema)

export default billingRateModel