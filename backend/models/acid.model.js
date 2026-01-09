import { Schema, model } from 'mongoose'

const acidBillingSchema = new Schema({
    billingLetter: String,
    attachments: [String],
    finalPdf: String,
    createdBy:{ type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
})

const acidBillingModel = model('AcidBilling', acidBillingSchema)

export default acidBillingModel