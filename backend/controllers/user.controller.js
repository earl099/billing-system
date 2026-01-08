import userModel from "../models/user.model.js";
import bcrypt from 'bcrypt';

export async function getUsers(_req, res) {
    try {
        const users = await userModel.find().select('-password')
        const total = await userModel.countDocuments()
        
        res.json({ users, total })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function getUser(req, res) {
    try {
        const user = await userModel.findById(req.params._id).select('-password')
        if(!user) return res.status(404).json({ message: 'User not found' });

        res.json({ user, message: 'User found' })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function createUser(req, res) {
    try {
        const { name, username, email, password, role, handledClients } = req.body
        
        //email and username checks
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
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function updateUser(req, res) {
    try {
        const { name, username, email, password, role, handledClients } = req.body
        const update = { name, username, email, role, handledClients }
        if(password !== undefined) update.password = await bcrypt.hash(password, 10);

        const user = await userModel.findByIdAndUpdate(req.params._id, update, { new: true }).select('-password')
        if(!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function deleteUser(req, res) {
    try {
        const user = await userModel.findByIdAndDelete({ _id: req.params._id })
        if(!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}
