const clientController = require('../controllers/clientController')
const router = require('express').Router()

//** ADD CLIENT **//
router.post('/add-client', clientController.addClient)

//** GET CLIENTS **//
router.get('/get-clients', clientController.getClients)
router.get('/get-clients/:offset/:limit', clientController.getClients)

//** GET CLIENT **//
router.get('/get-client/:id', clientController.getClient)

//** EDIT CLIENT **//
router.put('/edit-client/:id', clientController.editClient)

//** DELETE CLIENT **//
router.delete('delete-client/:id', clientController.deleteClient)

module.exports = router
