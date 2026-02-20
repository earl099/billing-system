import { Schema, model } from 'mongoose'

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