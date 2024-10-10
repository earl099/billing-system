"use strict"

const db = require('../config/sequelize')
const clientModel = db.clientModel

//** ADDING CLIENT **//
const addClient = async (req, res) => {
  const { clientCode, clientName, payFrequencyId } = req.body

  const client = {
    clientCode: clientCode,
    clientName: clientName,
    payFrequencyId: payFrequencyId
  }

  try {
    const createdClient = clientModel.create(client)
    res.status(200).send({ message: 'Client created.', createdClient: createdClient })
  } catch (e) {
    res.status(500).send({ message: 'Server error.', error: e })
  }
}

//** GET CLIENTS **//
const getClients = async (req, res) => {
  const { offset, limit } = req.body

  const clients = await clientModel.findAll({
    offset: offset,
    limit: limit
  })

  if(clients.length < 1) {
    res.status(200).send({ message: 'No Clients found.' })
  }
  else {
    res.status(200).send({ message: 'Clients found.', clients: clients })
  }
}

module.exports = {
  addClient,
  getClients
}
