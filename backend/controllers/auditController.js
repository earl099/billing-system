"use strict"

const db = require('../config/sequelize')
const auditModel = db.auditModel

//** ADDING AUDIT LOGS **/
const addLog = async (req, res) => {
  const { operation, user } = req.body

  const audit = {
    operation: operation,
    user: user
  }

  try {
    const auditLog = await auditModel.create(audit)
    res.status(200).send({ message: `Log created by ${audit.user}.`, auditLog: auditLog })
  } catch (err) {
    res.status(500).send({ message: 'Server error', error: err })
  }
}

//** GETTING AUDIT LOGS **/
const getLogs = async (req, res) => {
  const { offset, limit } = req.body

  const logs = await auditModel.findAll({
    attributes: ['operation', 'user', 'logDate'],
    offset: offset,
    limit: limit
  })

  if(logs.length < 1) {
    res.status(200).send({ message: 'No logs created', logs: logs })
  }
  else {
    res.status(400).send({ message: 'Log list created.', logs: logs })
  }
}

module.exports = {
  addLog,
  getLogs
}
