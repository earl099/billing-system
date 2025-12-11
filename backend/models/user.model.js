import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: [ 'Admin', 'User' ], default: 'User' },
    handledClients: { type: [String], default: [''] }
}, { timestamps: true })

const userModel = mongoose.model('User', userSchema)

export default userModel