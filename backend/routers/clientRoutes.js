const clientController = require('../controllers/clientController')
const router = require('express').Router()

//** ADD CLIENT **//
router.post('/add-client', clientController.addClient)

//** GET CLIENTS **//
router.get('/get-clients', clientController.getClients)

module.exports = router
