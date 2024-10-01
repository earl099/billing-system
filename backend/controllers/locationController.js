"use strict"

const db = require('../config/sequelize')
const locationModel = db.locationModel

//** ADD LOCATION **//
const addLoc = async (req, res) => {
  const { clientId, locName } = req.body

  const location = {
    clientId: clientId,
    locName: locName
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

  const locs = await locationModel.findAll({
    attributes: [
      'clientId',
      'locName'
    ],
    offset: offset,
    limit: limit
  })

  if(locs.length < 1) {
    res.status(200).send({ message: 'No locations found' })
  }
  else {
    res.status(200).send({ message: 'Locations found.', locs: locs })
  }
}

module.exports = {
  addLoc,
  getLocs
}
