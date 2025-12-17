import logModel from '../models/log.model.js'

export async function getLogs(req, res) {
    const { page = 1, limit = 20, q } = req.query
    const filter = q ? {
        $or: [
            { operation: new RegExp(q, 'i') },
            { user: new RegExp(q, 'i') }
        ]
    }: {}

    try {
        const logs = await logModel.find(filter).skip((page - 1) * limit).limit(Number(limit)).lean()
        const total = await logModel.countDocuments(filter)

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