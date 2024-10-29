"use strict"

const db = require('../config/sequelize')
const locationModel = db.locationModel

//** ADD LOCATION **//
const addLoc = async (req, res) => {
  const {
    deptId,
    locName,
    type,
    description,
    status
  } = req.body

  const location = {
    deptId,
    locName,
    type,
    description,
    status
  }

  try {
    const createdLoc = await locationModel.create(location)
    res.status(200).send({ message: 'Location created', createdLoc: createdLoc })
  } catch (e) {
    res.status(500).send({ message: 'Server error', error: e })
  }
}

//** GET LOCATIONS **//
const getLocs = async (req, res) => {
  const { offset, limit } = req.body

  if(offset == null && limit == null) {
    const locs = await locationModel.findAll()

    if(locs.length < 1) {
      res.status(200).send({ message: 'No locations found' })
    }
    else {
      res.status(200).send({ message: 'Locations found.', locs })
    }
  }
  else {
    const { count, rows } = await locationModel.findAndCountAll({ offset, limit })

    if(count < 1) {
      res.status(200).send({ message: 'No locations found' })
    }
    else {
      res.status(200).send({ message: 'Locations found', count, rows })
    }
  }
}

//** GET LOCATION **//
const getLoc = async (req, res) => {
  const { id } = req.params

  const loc = await locationModel.findOne({ where: { id } })

  if(loc) {
    res.status(200).send({ message: 'Location found', loc })
  }
  else {
    res.status(200).send({ message: 'No Location found.' })
  }
}

//** EDIT LOCATION **//
const editLoc = async (req, res) => {
  const { id } = req.params
  const {
    deptId,
    locName,
    type,
    description,
    status
  } = req.body

  const locObj = {
    deptId,
    locName,
    type,
    description,
    status
  }

  try {
    const updatedLoc = await locationModel.update(locObj, { where: { id } })

    res.status(200).send({ message: 'Updated Location successfully', updatedLoc })
  } catch (error) {
    res.status(500).send({ message: 'Server Error', error })
  }
}

//** DELETE LOCATION **//
const delLoc = async (req, res) => {
  const { id } = req.params

  const deletedLoc = await locationModel.destroy({ where: { id } })

  if(deletedLoc) {
    res.status(200).send({ message: 'Deleted location', deletedLoc })
  }
  else {
    res.status(404).send({ message: 'No location deleted.' })
  }
}

module.exports = {
  addLoc,
  getLocs,
  getLoc,
  editLoc,
  delLoc
}
