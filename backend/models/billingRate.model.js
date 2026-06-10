import { Schema, model } from "mongoose";

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
