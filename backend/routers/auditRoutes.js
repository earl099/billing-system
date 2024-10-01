const auditController = require('../controllers/auditController.js')
const router = require('express').Router()

//add log route
router.post('/add-log', auditController.addLog)

//get logs route
router.get('/get-logs', auditController.getLogs)

module.exports = router
