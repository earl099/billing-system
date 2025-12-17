import { Schema, model } from "mongoose";

const payFreqSchema = new Schema({ payType: String })

const payFreqModel = model('PayFreq', payFreqSchema)

export default payFreqModel