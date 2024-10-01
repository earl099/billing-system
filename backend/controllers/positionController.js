"use strict"

const db = require('../config/sequelize')
const positionModel = db.positionModel

//** ADD POSITIONS **//
const addPosition = async (req, res) => {
  const { clientId, posName } = req.body

  const position = {
    clientId: clientId,
    posName: posName
  }

  try {
    const createdPos = await positionModel.create(position)
    res.status(200).send({ message: 'Position created.', createdPos: createdPos })
  } catch (e) {
    res.status(500).send({ message: 'Server error.', error: e })
  }
}

//** GET POSITIONS **//
const getPositions = async (req, res) => {
  const { offset, limit } = req.body

  const positions = await positionModel.findAll({
    attributes: [
      'clientId',
      'posName'
    ],
    offset: offset,
    limit: limit
  })

  if(positions.length < 1) {
    res.status(200).send({ message: 'No Positions found' })
  }
  else {
    res.status(200).send({ message: 'Positions found', positions: positions })
  }
}

module.exports = {
  addPosition,
  getPositions
}
