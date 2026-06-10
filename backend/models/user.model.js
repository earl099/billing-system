import { Schema, model } from "mongoose";

const userSchema = Schema({
    name: { 
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    username: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please provide a valid email address']
    },
    password: { 
        type: String, 
        required: true,
        minlength: 8,
        maxlength: 255
        // Note: password should be hashed before storage (handled in controller)
    },
    role: { 
        type: String, 
        enum: ['Admin', 'User'], 
        default: 'User',
        immutable: true  // Prevent role manipulation after creation
    },
    handledClients: { 
        type: [Schema.Types.ObjectId], 
        ref: 'Client', 
        default: []
    }
}, { timestamps: true })

const userModel = model('User', userSchema)

export default userModel