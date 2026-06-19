/**
 * @fileoverview User controller
 * Handles CRUD operations for user accounts (admin management)
 */

import userModel from "#models/user.model.js";
import bcrypt from 'bcrypt';

/**
 * Gets all users (excludes password field)
 * 
 * @param {import('express').Request} _req - Express request (unused)
 * @param {import('express').Response} res - Response with { users[], total }
 */
export async function getUsers(_req, res) {
    try {
        const users = await userModel.find().select('-password')
        const total = await userModel.countDocuments()

        res.json({ users, total })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Gets a single user by ID (excludes password field)
 * 
 * @param {import('express').Request} req - Request with params: { _id }
 * @param {import('express').Response} res - Response with { user, message }
 */
export async function getUser(req, res) {
    try {
        const user = await userModel.findById(req.params._id).select('-password')
        if(!user) return res.status(404).json({ message: 'User not found' });

        res.json({ user, message: 'User found' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Creates a new user account
 * Validates email and username uniqueness, hashes password before storage
 * 
 * @param {import('express').Request} req - Request with body: { name, username, email, password, role, handledClients }
 * @param {import('express').Response} res - Response with { user }
 */
export async function createUser(req, res) {
    try {
        const { name, username, email, password, role, handledClients } = req.body

        const existingEmail = await userModel.findOne({ email })
        if(existingEmail) return res.status(400).json({ message: 'Email already exists' });
        const existingUsername = await userModel.findOne({ username })
        if(existingUsername) return res.status(400).json({ message: 'Username already exists' });

        const hash = await bcrypt.hash(password, 10)
        const user = await userModel.create({ name, username, email, password: hash, role, handledClients })

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
            }
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Updates an existing user
 * Hashes password if provided in update. Returns user without password field.
 * 
 * @param {import('express').Request} req - Request with params: { _id }, body: { name, username, email, password?, role, handledClients }
 * @param {import('express').Response} res - Response with { user }
 */
export async function updateUser(req, res) {
    try {
        const { name, username, email, password, role, handledClients } = req.body
        const update = { name, username, email, role, handledClients }
        if(password !== undefined) update.password = await bcrypt.hash(password, 10);

        const user = await userModel.findByIdAndUpdate(req.params._id, update, { new: true }).select('-password')
        if(!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Deletes a user by ID
 * 
 * @param {import('express').Request} req - Request with params: { _id }
 * @param {import('express').Response} res - Response with success message
 */
export async function deleteUser(req, res) {
    try {
        const user = await userModel.findByIdAndDelete(req.params._id)
        if(!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}
