"use strict"

const db = require('../config/sequelize')
const classificationModel = db.classificationModel

//** ADD CLASSIFICATION **//
const addClass = async (req, res) => {
  const { clientId, className, status, description } = req.body

  const classObj = {
    clientId: clientId,
    className: className,
    status: status,
    description: description
  }

  try {
    const createdClass = await classificationModel.create(classObj)
    res.status(200).send({ message: 'Classification created', createdClass: createdClass })
  } catch (e) {
    res.status(500).send({ message: 'Server error.', error: e })
  }
}

const getClass = async (req, res) => {
  const { offset, limit } = req.body

  const classifications = await classificationModel.findAll({
    attributes: [
      'clientId',
      'className',
      'status',
      'description'
    ],
    offset: offset,
    limit: limit
  })

  if(classifications.length < 1) {
    res.status(200).send({ message: 'No Classifications found' })
  }
  else {
    res.status(200).send({ message: 'Classification found', classifications: classifications })
  }
}

module.exports = {
  addClass,
  getClass
}
