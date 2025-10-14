import { Schema, model } from 'mongoose'; // Erase if already required

// Declare the Schema of the Mongo model
const logSchema = new Schema({
    operation: String,
    user: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

//Export the model
export default model('Log', logSchema);