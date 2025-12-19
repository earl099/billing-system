import { Schema, model } from 'mongoose'

const acidBillingSchema = new Schema({
    referenceNo: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    clientName: {
        type: [Schema.Types.ObjectId],
        ref: 'Client',
        required: true
    },
    billingPeriod: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },

    billingLetterDocx: String,
    uploadedFiles: [String],
    finalPdf: String,

    createdBy: String,
    createdAt: { type: Date, default: Date.now }
})

const acidBillingModel = model('AcidBilling', acidBillingSchema)

export default acidBillingModel