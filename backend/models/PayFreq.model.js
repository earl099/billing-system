import { Schema, model } from 'mongoose'; // Erase if already required

// Declare the Schema of the Mongo model
var payFreqSchema = new Schema({
    payType: String
});

const PayFreq = model('PayFreq', payFreqSchema);

//Export the model
export default PayFreq