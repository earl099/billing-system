import { Schema, model } from "mongoose";

const logSchema = new Schema({
    operation: { type: String },
    user: { type: String }
}, { timestamps: true })

const logModel = model('Log', logSchema)

export default logModel