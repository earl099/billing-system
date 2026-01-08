import payFreqModel from '../models/payfreq.model.js'

export async function getPayFreqs(_req, res) {
    try {
        const payFreqs = await payFreqModel.find()
        const total = await payFreqModel.countDocuments()

        if(payFreqs.length < 1) {
            const payFreqObj = { payType: 'ALL' }
            await payFreqModel.create(payFreqObj)
        }

        res.json({ payFreqs, total })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function createPayFreq(req, res) {
    try {
        const { payType } = req.body
        const payFreq = await payFreqModel.create({ payType })

        res.status(200).json({ payFreq })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function deletePayFreq(req, res) {
    try {
        const payFreq = await payFreqModel.findByIdAndDelete({ _id: req.params._id })
        if(!payFreq) return res.status(404).json({ message: 'Pay Frequency not found' })

        res.json({ message: 'Pay Frequency deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}
