"use strict"

const db = require('../config/sequelize')
const classificationModel = db.classificationModel

//** ADD CLASSIFICATION **//
const addClass = async (req, res) => {
  const { clientId, className, status, description } = req.body

  const classObj = {
    clientId,
    className,
    status,
    description
  }

  try {
    const createdClass = await classificationModel.create(classObj)
    res.status(200).send({ message: 'Classification created', createdClass: createdClass })
  } catch (e) {
    res.status(500).send({ message: 'Server error.', error: e })
  }
}

//** GET CLASSIFICATIONS **//
const getClasses = async (req, res) => {
  const { offset, limit } = req.body

  if((offset == null || offset == undefined) && (limit == null || limit == undefined)) {
    const classifications = await classificationModel.findAll()

    if(classifications.length < 1) {
      res.status(200).send({ message: 'No Classifications found' })
    }
    else {
      res.status(200).send({ message: 'Classification found', classifications })
    }
  }
  else {
    const { rows, count } = await classificationModel.findAndCountAll({ offset, limit })

    if(count < 1) {
      res.status(200).send({ message: 'No classifications found' })
    }
    else {
      res.status(200).send({ message: 'Classifications found', rows, count })
    }
  }
}

//** GET CLASSIFICATION **//
const getClass = async (req, res) => {
  const { id } = req.params

  let classObj = await classificationModel.findOne({ where: { id } })

  if(classObj) {
    res.status(200).send({ message: 'Classification found', classObj })
  }
  else {
    res.status(200).send({ message: 'No classification found' })
  }
}


//** EDIT CLASSIFICATION **//
const editClass = async (req, res) => {
  const { id } = req.params
  const {
    clientId,
    className,
    status,
    description
  } = req.body

  const classObj = {
    clientId,
    className,
    status,
    description
  }

  try {
    const updatedClass = await classificationModel.update(classObj, { where: { id } })

    res.status(200).send({ message: 'Updated classification successfully', updatedClass })
  } catch (error) {
    res.status(500).send({ message: 'Server error', error })
  }
}

//** DELETE CLASSIFICATION **//
const delClass =async (req, res) => {
  const { id } = req.params

  const deletedClass = await classificationModel.destroy({ where: { id } })

  if(deletedClass) {
    res.status(200).send({ message: 'Deleted classification' })
  }
  else {
    res.status(404).send({ message: 'No classification deleted.' })
  }
}

module.exports = {
  addClass,
  getClasses,
  getClass,
  editClass,
  delClass
}
