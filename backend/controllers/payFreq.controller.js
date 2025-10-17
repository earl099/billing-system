import PayFreq from "../models/PayFreq.model.js";
import createError from "../middleware/error-utils.js";

const createPayFreq = (req, res, next) => {
    try {
        const payFreq = new PayFreq({ payType: req.body.payType })

        return payFreq.save()
        .then(result => {
            res.status(200).json({
                message: 'Pay Frequency created successfully',
                payFreq: result
            })
        })
        .catch(_err => { next(createError('Pay Frequency creation failed', 500)) })
    } catch (error) {
        next(error)
    }
}

const getPayFreqs = (_req, res, next) => {
    try {
        const payFreqQuery = PayFreq.find()
        let fetchedPayFreqs

        payFreqQuery
        .then(payFreqs => {
            fetchedPayFreqs = payFreqs
            res.status(200).json({
                message: 'Fetching Pay Frequencies successful',
                payFreqs: fetchedPayFreqs
            })
        })
        .catch(_err => { next(createError('Fetching Pay Frequencie failed', 500)) })
    } catch (error) {
        next(error)
    }
}

const getPayFreq = (req, res, next) => {
    try {
        const payFreqQuery = PayFreq.findById(req.params._id)
        let fetchedPayFreq

        payFreqQuery
        .then(result => {
            fetchedPayFreq = result
            res.status(200).json({
                message: 'Fetching Pay Frequency successful',
                payFreq: fetchedPayFreq
            })
        })
        .catch(_err => { next(createError('Fetching Pay Frequency failed', 500)) })
    } catch (error) {
        next(error)
    }
}

const updatePayFreq = (req, res, next) => {
    try {
        PayFreq.findById(req.params._id)
        .catch(_err => next(createError('Pay Frequency not found', 404)))
        .then(() => {
            const payFreq = new PayFreq({ payType: req.body.payType })

            PayFreq.findByIdAndUpdate({ _id: req.params._id }, payFreq)
            .then(result => {
                if(result) {
                    res.status(200).json({
                        message: 'Updating Pay Frequency successful',
                        payFreq: result
                    })
                }
                else {
                    next(createError('Not authorized to update Pay Frequency', 401))
                }
            })
            .catch(_err => next(createError('Updating Pay Frequency failed', 500)))
        })
    } catch (error) {
        next(error)
    }
}

const deletePayFreq = (req, res, next) => {
    try {
        PayFreq.findByIdAndDelete(req.body._id)
        .then(res.status(200).json({
            message: 'Deleting Pay Frequency successful'
        }))
        .catch(_err => next(createError('Deleting Pay Frequency failed', 500)))
    } catch (error) {
        next(error)
    }
}

const payFreqController = {
    createPayFreq,
    getPayFreqs,
    getPayFreq,
    updatePayFreq,
    deletePayFreq
}

export default payFreqController