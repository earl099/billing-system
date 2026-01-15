import { Schema, model } from "mongoose";

const userSchema = Schema({
    name: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: [ 'Admin', 'User' ], default: 'User' },
    handledClients: { type: [Schema.Types.ObjectId | null], ref: 'Client', default: '' }
}, { timestamps: true })

const userModel = model('User', userSchema)

export default userModel