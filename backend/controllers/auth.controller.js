/**
 * @fileoverview Authentication controller
 * Handles user registration (signup), login, session validation, and data clearing
 */

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { model, Schema } from 'mongoose'
import userModel from "#models/user.model.js";
import clientModel from "#models/client.model.js";
import payFreqModel from "#models/payfreq.model.js";

/** @type {string} JWT signing secret from environment variables */
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required')
}

const bootstrapClaimModel = model('AdminBootstrapClaim', new Schema({
    _id: String
}, { versionKey: false }))

/**
 * Registers a new user account
 * The first administrator must provide the one-time bootstrap key.
 * Subsequent public registrations are regular Users with selected client access.
 * Returns a JWT token and user info on success.
 * 
 * @param {import('express').Request} req - Request with body: { name, username, email, password, bootstrapKey?, handledClients? }
 * @param {import('express').Response} res - Response with { token, user } or error
 */
export async function signup(req, res) {
    const { name, username, email, password, handledClients } = req.body

    try {
        const existingEmail = await userModel.findOne({ email })
        if(existingEmail) return res.status(400).json({ message: 'Email already exists' });

        const existingUsername = await userModel.findOne({ username })
        if(existingUsername) return res.status(400).json({ message: 'Username already exists' });

        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)

        const [userCount, existingAdmin] = await Promise.all([
            userModel.countDocuments(),
            userModel.exists({ role: 'Admin' })
        ])
        let user
        if (!existingAdmin) {
            const bootstrapKey = process.env.ADMIN_BOOTSTRAP_KEY
            if (!bootstrapKey || req.body.bootstrapKey !== bootstrapKey) {
                return res.status(403).json({ message: 'Admin bootstrap key is required for the first account' })
            }

            try {
                await bootstrapClaimModel.create({ _id: 'initial-admin' })
            } catch (error) {
                if (error.code === 11000) {
                    return res.status(403).json({ message: 'Initial admin account has already been claimed' })
                }
                throw error
            }

            try {
                let client = await clientModel.findOne({ code: 'ALL' })
                if (!client) {
                    let payFreq = await payFreqModel.findOne({ payType: 'ALL' })
                    if (!payFreq) {
                        payFreq = await payFreqModel.create({ payType: 'ALL' })
                    }
                    client = await clientModel.create({
                        code: 'ALL',
                        name: 'All Clients',
                        payFreq: [payFreq._id]
                    })
                }

                user = await userModel.create({
                    name,
                    username,
                    email,
                    password: hash,
                    role: 'Admin',
                    handledClients: [client._id]
                })
            } catch (error) {
                await bootstrapClaimModel.deleteOne({ _id: 'initial-admin' })
                throw error
            }
        }
        else {
            if (userCount === 1 && !(await clientModel.exists({ code: 'NONE' }))) {
                const payFreq = await payFreqModel.create({ payType: 'NONE' })
                await clientModel.create({
                    code: 'NONE',
                    name: 'No Clients',
                    payFreq: [payFreq._id]
                })
            }

            const selectedClients = await clientModel.find({
                _id: { $in: handledClients ?? [] },
                code: { $nin: ['ALL', 'NONE'] }
            }).select('_id')

            user = await userModel.create({
                name,
                username,
                email,
                password: hash,
                handledClients: selectedClients.map((client) => client._id)
            })
        }

        if (!user) {
            throw new Error('User registration did not create an account')
        }

        const token = jwt.sign({ id: user._id, username: user.username, name: user.name }, JWT_SECRET, { expiresIn: '1d' })
        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role
            }
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Authenticates a user with username/email and password
 * Accepts either email (contains @) or username as the identifier.
 * Returns a JWT token valid for 1 day and user info on success.
 * 
 * @param {import('express').Request} req - Request with body: { identifier, password }
 * @param {import('express').Response} res - Response with { token, user } or error
 */
export async function login(req, res) {
    const { identifier, password } = req.body

    try {
        let user
        // Determine if identifier is email or username
        if(identifier.includes('@')) {
            user = await userModel.findOne({ email: identifier })
        }
        else {
            user = await userModel.findOne({ username: identifier })
        }
        if(!user) return res.status(400).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password)
        if(!match) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ 
            id: user._id, 
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role
        }, JWT_SECRET, { expiresIn: '1d' })

        if(identifier.includes('@')) {
            return res.status(200).json({
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    username: user.username,
                    role: user.role
                }
            })
        }
        else {
            return res.status(200).json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            })
        }
        
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Returns the currently authenticated user's profile
 * Requires valid JWT token in Authorization header (set by authMiddleware)
 * 
 * @param {import('express').Request} req - Request with req.user.id from authMiddleware
 * @param {import('express').Response} res - Response with { user } or error
 */
export async function me(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select('-password')
        if(!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ user })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

/**
 * Deletes all users, pay frequencies, and clients from the database
 * WARNING: Destructive operation - clears all authentication-related data
 * 
 * @param {import('express').Request} _req - Express request (unused)
 * @param {import('express').Response} res - Response with deletion results
 */
export async function clearAll(_req, res) {
    try {
        const user = await userModel.deleteMany({})
        const payFreq = await payFreqModel.deleteMany({})
        const client = await clientModel.deleteMany({})

        res.json({ user, payFreq, client })
    } catch (error) {
        res.json({ error })
    }
}
