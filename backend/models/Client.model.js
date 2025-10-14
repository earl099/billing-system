import { Schema, model } from 'mongoose'; // Erase if already required

// Declare the Schema of the Mongo model
const clientSchema = new Schema({
    code:{
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    name:{
        type: String,
        required: true,
        unique: true,
    },
    operations:{
        type: [String],
        required: true,
        unique: true,
    }
});

const Client = model('Client', clientSchema);

//Export the model
export default Client