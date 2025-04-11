"use strict"

const db = require('../config/sequelize')
const clientModel = db.clientModel

//** ADDING CLIENT **//
const addClient = async (req, res) => {
  const {
    clientCode,
    clientName,
    payFreqId,
    description,
    status
  } = req.body

  const client = {
    clientCode,
    clientName,
    payFreqId,
    description,
    status
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
  const { offset, limit } = req.params

  if((limit == NaN || limit == undefined) && (offset == NaN || offset == undefined)) {
    const clients = await clientModel.findAll()

    if(clients.length > 0) {
      res.status(200).send({ message: 'Client records found.', clients: clients })
    }
    else {
      res.status(200).send({ message: 'No client records found.' })
    }
  }
  else {
    try {
      const { count, rows } = await clientModel.findAndCountAll({
        offset: Number(offset), limit: Number(limit)
      })

      res.status(200).send({ message: 'Client Records found', count: count, rows: rows })
    } catch (error) {
      res.status(500).send({ message: 'Server error', error: error })
    }
  }
}

//** GET CLIENT **//
const getClient = async (req, res) => {
  const { id } = req.params

  const client = await clientModel.findOne({ where: { id } })

  if(client) {
    res.status(200).send({ message: 'Client found', client })
  }
  else {
    res.status(200).send({ message: 'No client found' })
  }
}

//** EDIT CLIENT **//
const editClient = async (req, res) => {
  const { id } = req.params
  const {
    clientCode,
    clientName,
    payFreqId,
    description,
    status
  } = req.body

  const clientObj = {
    clientCode,
    clientName,
    payFreqId,
    description,
    status
  }

  try {
    const updatedClient = await clientModel.update(clientObj, { where: { id } })

    res.status(200).send({ message: 'Updated Client details successfully', updatedClient })
  } catch (error) {
    res.status(500).send({ message: 'Server error', error })
  }
}

//** DELETE CLIENT **//
const deleteClient = async (req, res) => {
  const { id } = req.params

  try {
    const deletedClient = await clientModel.destroy({ where: { id } })

    if(deletedClient) {
      res.status(200).send({ message: 'Deleted client successfully', deletedClient })
    }
  } catch (error) {
    res.status(500).send({ message: 'Server error', error })
  }
}

module.exports = {
  addClient,
  getClients,
  getClient,
  editClient,
  deleteClient
}
