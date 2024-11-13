"use strict"

const db = require('../config/sequelize')
const positionModel = db.positionModel

//** ADD POSITION **//
const addPosition = async (req, res) => {
  const {
    clientId,
    posCode,
    posName,
    dailySalaryRate,
    dailyBillingRate,
    monthlySalaryRate,
    monthlyBillingRate,
    description,
    status
  } = req.body

  const position = {
    clientId,
    posCode,
    posName,
    dailySalaryRate,
    dailyBillingRate,
    monthlySalaryRate,
    monthlyBillingRate,
    description,
    status
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

  if(offset == null && limit == null) {
    const positions = await positionModel.findAll()

    if(positions.length < 1) {
      res.status(200).send({ message: 'No Positions found' })
    }
    else {
      res.status(200).send({ message: 'Positions found', positions })
    }
  }
  else {
    const { count, rows } = await positionModel.findAndCountAll({ offset, limit })

    if(count < 1) {
      res.status(200).send({ message: 'No positions found' })
    }
    else {
      res.status(200).send({ message: 'Positions found', count, rows })
    }
  }
}

//** GET POSITION **//
const getPosition = async (req, res) => {
  const { id } = req.params

  const position = await positionModel.findOne({ where: { id } })

  if(position) {
    res.status(200).send({ message: 'Position found', position })
  }
  else {
    res.status(200).send({ message: 'No Position found' })
  }
}

//** EDIT POSITION **//
const editPosition = async (req, res) => {
  const { id } = req.params
  const {
    clientId,
    posCode,
    posName,
    dailySalaryRate,
    dailyBillingRate,
    monthlySalaryRate,
    monthlyBillingRate,
    description,
    status
  } = req.body

  const posObj = {
    clientId,
    posCode,
    posName,
    dailySalaryRate,
    dailyBillingRate,
    monthlySalaryRate,
    monthlyBillingRate,
    description,
    status
  }

  try {
    const updatedPosition = await positionModel.update(posObj, { where: { id } })

    res.status(200).send({ message: 'Updated position', updatedPosition })
  } catch (error) {
    res.status(500).send({ message: 'Server error', error })
  }
}

//** DELETE POSITION **//
const delPosition = async (req, res) => {
  const { id } = req.params

  const deletedPosition = await positionModel.destroy({ where: { id } })

  if(deletedPosition) {
    res.status(200).send({ message: 'Deleted position successfully', deletedPosition })
  }
  else {
    res.status(404).send({ message: 'No position deleted' })
  }
}

module.exports = {
  addPosition,
  getPositions,
  getPosition,
  editPosition,
  delPosition
}
