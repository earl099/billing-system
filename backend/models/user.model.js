/**
 * @fileoverview User model for application authentication and authorization
 * Stores user credentials, role assignments, and client associations
 */

import { Schema, model } from "mongoose";

/**
 * @typedef {Object} User
 * @property {string} name - User's full name (2-100 chars, trimmed)
 * @property {string} username - Unique login username (3-50 chars, lowercased)
 * @property {string} email - Unique email address (validated format)
 * @property {string} password - Hashed password (8-255 chars, hashed before storage)
 * @property {'Admin'|'User'} role - User role, immutable after creation (default: 'User')
 * @property {import('mongoose').ObjectId[]} handledClients - References to assigned Client documents
 * @property {Date} createdAt - Auto-managed creation timestamp
 * @property {Date} updatedAt - Auto-managed update timestamp
 */
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
        default: 'User'
    },
    handledClients: { 
        type: [Schema.Types.ObjectId], 
        ref: 'Client', 
        default: []
    }
}, { timestamps: true })

const userModel = model('User', userSchema)

export default userModel
