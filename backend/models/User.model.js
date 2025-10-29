import { Schema, model } from "mongoose";

const userSchema = Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'User'
    },
    handledClients: [String]
}, { timestamps: true })

const User = model('User', userSchema)

export default User