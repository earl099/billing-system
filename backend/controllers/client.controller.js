import clientModel from '../models/client.model.js';
import payFreqModel from '../models/payfreq.model.js';

export async function getClients(_req, res) {
    try {
        const clients = await clientModel.find()
        const total = await clientModel.countDocuments()

        if(clients.length < 1) {
            const payFreq = await payFreqModel.findOne({ payType: 'ALL' })
            const clientObj = {
                code: 'ALL',
                name: 'All Clients',
                payFreq: payFreq._id
            }

            await clientModel.create(clientObj)
        }

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