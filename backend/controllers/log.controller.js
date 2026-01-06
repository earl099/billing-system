import logModel from '../models/log.model.js'

export async function getLogs(_req, res) {
    try {
        const logs = await logModel.find()
        const total = await logModel.countDocuments()

        res.json({ logs, total })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function getLog(req, res) {
    try {
        const log = await logModel.findById(req.params._id)
        if(!log) return res.status(404).json({ message: 'Log not found' })
        
        res.status(200).json({ log, message: 'Log found' })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function createLog(req, res) {
    try {
        const { operation, user } = req.body
        const log = await logModel.create({ operation, user })

        res.json({ log })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function deleteLog(req, res) {
    try {
        const log = await logModel.findByIdAndDelete({ _id: req.params._id })
        if(!log) return res.status(404)
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}