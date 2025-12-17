import clientModel from '../models/client.model.js';

export async function getClients(req, res) {
    const search = req.query.search || ''

    const filter = search ? {
        $or: [
            { code: new RegExp(search, 'i') },
            { name: new RegExp(search, 'i') }
        ]
    }: {}

    try {
        const clients = await clientModel.find(filter)
        const total = await clientModel.countDocuments(filter)

        res.json({ clients, total })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function getClient(req, res) {
    try {
        const client = await clientModel.findById(req.params._id)
        if(!client) return res.status(404).json({ message: 'Client not found' })

        res.json({ client, message: 'Client found' })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function createClient(req, res) {
    try {
        const { code, name, payFreq } = req.body
        const client = await clientModel.create({ code, name, payFreq })
        res.json({ client })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function updateClient(req, res) {
    try {
        const { code, name, payFreq } = req.body
        const update = { code, name, payFreq }

        const client = await clientModel.findByIdAndUpdate(req.params._id, update, { new: true })
        if(!client) return res.status(404).json({ message: 'Client not found' })
        res.json({ client })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function deleteClient(req, res) {
    try {
        const client = await clientModel.findByIdAndDelete({ _id: req.params._id })
        if(!client) return res.status(404).json({ message: 'Client not found' })
        res.json({ message: 'Client deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}