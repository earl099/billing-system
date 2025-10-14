import express from 'express'
import clientController from '../controllers/client.controller.js'

const clientRouter = express.Router()

clientRouter.post('/client', clientController.createClient)

clientRouter.get('/client', clientController.getClients)

clientRouter.get('/client/:_id', clientController.getClient)

clientRouter.put('/client/:_id', clientController.updateClient)

clientRouter.delete('/client/:_id', clientController.deleteClient)

export default clientRouter