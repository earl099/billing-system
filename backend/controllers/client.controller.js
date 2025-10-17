import Client from '../models/Client.model.js'
import createError from '../middleware/error-utils.js'

const createClient = (req, res, next) => {
    try {
        const client = new Client({
            code: req.body.code,
            name: req.body.name,
            operations: req.body.operations
        })

        return client.save()
        .then(result => {
            res.status(200).json({
                message: 'Client creation successful',
                client: result
            })
        })
        .catch(_err => { next(createError('Client creation failed', 500)) })
    } catch (error) {
        next(error)
    }
}

const getClients = (_req, res, next) => {
    try {
        const clientQuery = Client.find()
        let fetchedClients

        clientQuery
        .catch(_err => createError('Fetching client failed', 500))
        .then((clients) => {
            fetchedClients = clients
            res.status(200).json({
                message: 'Fetching client successful',
                clients: fetchedClients
            })
        })
    } catch (error) {
        next(error)
    }
}

const getClient = (req, res, next) => {
    try {
        const clientQuery = Client.findById(req.params._id)
        let fetchedClient

        clientQuery
        .catch(_err => createError('Fetching client failed', 500))
        .then(result => {
            fetchedClient = result
            res.status(200).json({
                message: 'Fetching client successful',
                client: fetchedClient
            })
        })
    } catch (error) {
        next(error)
    }
}

const updateClient = (req, res, next) => {
    try {
        Client.findById(req.params._id)
        .catch(_err => next(createError('Client not found', 404)))
        .then(() => {
            const client = new Client({
                code: req.body.code,
                name: req.body.body,
                operations: req.body.operations
            })

            Client.findByIdAndUpdate({ _id: req.params._id }, client)
            .then(result1 => {
                if(result1) {
                    res.status(200).json ({
                        message: 'Client updated',
                        client: result1
                    })
                }
                else {
                    next(createError('Not authorized to update client', 401))
                }
            })
            .catch(_err => next(createError('Updating client failed', 500)))
        })
    } catch (error) {
        next(error)
    }
}

const deleteClient = (req, res, next) => {
    try {
        Client.findByIdAndDelete(req.params._id)
        .catch(_err => next(createError('Deleting client failed', 500)))
        .then(result => {
            if(result.deletedCount > 0) {
                res.status(200).json({ message: 'Deleting client successful' })
            }
            else {
                next(createError('Not authorized to delete client', 401))
            }
        })
    } catch (error) {
        next(error)
    }
}

const clientController = {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient
}

export default clientController