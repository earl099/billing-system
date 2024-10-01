"use strict"

const db = require('../config/sequelize')
const wageModel = db.wageModel

//** ADDING WAGE **//
const addWage = async (req, res) => {
  const { clientId, wageName, offset, limit } = req.body

  const wage = {
    clientId: clientId,
    wageName: wageName
  }

  try {
    const createdWage = await wageModel.create(wage)
    res.status(200).send({ message: 'Wage created.', createdWage: createdWage })
  } catch (e) {
    res.status(500).send({ message: 'Server error.', error: e })
  }
}

//** GET WAGES **//
const getWages = async (req, res) => {
  const { offset, limit } = req.body

  const wages = await wageModel.findAll({
    attributes: [
      'clientId',
      'wageName'
    ],
    offset: offset,
    limit: limit
  })

  if(wages.length < 1) {
    res.status(200).send({ message: 'No wages found.' })
  }
  else {
    res.status(200).send({ message: 'Wages found', wages: wages })
  }
}

module.exports = {
  addWage,
  getWages
}
