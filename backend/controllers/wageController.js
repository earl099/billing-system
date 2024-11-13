"use strict"

const { where } = require('sequelize')
const db = require('../config/sequelize')
const wageModel = db.wageModel

//** ADDING WAGE **//
const addWage = async (req, res) => {
  const { wageName, description, clientId, status } = req.body

  const wage = {
    wageName,
    clientId,
    description,
    status
  }

  try {
    const createdWage = await wageModel.create(wage)
    res.status(200).send({ message: 'Wage created.', createdWage })
  } catch (e) {
    res.status(500).send({ message: 'Server error.', error: e })
  }
}

//** GET WAGES **//
const getWages = async (req, res) => {
  const { offset, limit } = req.body

  if(offset == null && limit == null) {
    const wages = await wageModel.findAll()

    if(wages.length < 1) {
      res.status(200).send({ message: 'No wages found.' })
    }
    else {
      res.status(200).send({ message: 'Wages found', wages })
    }
  }
  else {
    const { count, rows } = await wageModel.findAndCountAll({
      offset,
      limit
    })

    if(count < 1) {
      res.status(200).send({ message: 'No wages found.' })
    }
    else {
      res.status(200).send({ message: 'Wages found.', count, rows })
    }
  }
}

const getWage = async (req, res) => {
  const { id } = req.params

  const wage = await wageModel.findOne({ where: { id } })

  if(wage) {
    res.status(200).send({ message: 'Wage found', wage })
  }
  else {
    res.status(200).send({ message: 'No wage found.' })
  }
}

const editWage = async (req, res) => {
  const { id } = req.params
  const {
    wageName,
    clientId,
    description,
    status
  } = req.body

  const wageObj = {
    wageName,
    clientId,
    description,
    status
  }

  try {
    const updatedWage = await wageModel.update(wageObj, { where: { id } })

    res.status(200).send({ message: 'Updated wage successfully', updatedWage })
  } catch (error) {
    res.status(500).send({ message: 'Server error', error })
  }
}

const delWage = async (req, res) => {
  const { id } = req.params

  const deletedWage = await wageModel.destroy({ where: { id } })

  if(deletedWage) {
    res.status(200).send({ message: 'Deleted wage successfully', deletedWage })
  }
  else {
    res.status(404).send({ message: 'No wage deleted' })
  }
}

module.exports = {
  addWage,
  getWages,
  getWage,
  editWage,
  delWage
}
