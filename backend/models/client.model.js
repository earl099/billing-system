import { Schema, model } from "mongoose";

const clientSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    payFreq: {
        type: [Schema.Types.ObjectId],
        ref: 'PayFreq'
    }
}, { timestamps: true })

const clientModel = model('Client', clientSchema)

export default clientModel