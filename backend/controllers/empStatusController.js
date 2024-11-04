"use strict"

const db = require('../config/sequelize')
const empStatusModel = db.empStatusModel

//** ADD EMPLOYMENT STATUS **//
const addEmpStatus = async (req, res) => {
  const {
    empStatusName,
    clientId,
    description,
    status
  } = req.body

  const empStatusObj ={
    empStatusName,
    clientId,
    description,
    status
  }

  try {
    const createdEmpStatus = await empStatusModel.create(empStatusObj)
    res.status(200).send({ message: 'Employment Status Created', createdEmpStatus })
  } catch (error) {
    res.status(500).send({ message: 'Server error', error })
  }
}

//** GET EMPLOYMENT STATUSES **//
const getEmpStatuses = async (req, res) => {
  const { offset, limit } = req.params

  if(offset == null && limit == null) {
    const empStatuses = await empStatusModel.findAll()

    if(empStatuses.length < 1) {
      res.status(200).send({ message: 'No Employment Status found' })
    }
    else {
      res.status(200).send({ message: 'Employment Status found', empStatuses })
    }
  }
  else {
    const { count, rows } = await empStatusModel.findAndCountAll({ offset, limit })

    if(count < 1) {
      res.status(200).send({ message: 'No employment status found' })
    }
    else {
      res.status(200).send({ message: 'Employment Statuses found', count, rows })
    }
  }
}

//** GET EMPLOYMENT STATUS **//
const getEmpStatus = async (req, res) => {
  const { id } = req.params

  const empStatus = await empStatusModel.findOne({ where: { id } })

  if(empStatus) {
    res.status(200).send({ message: 'Employment Status Found', empStatus })
  }
  else {
    res.status(200).send({ message: 'No employment status found' })
  }
}

//** EDIT EMPLOYMENT STATUS **//
const editEmpStatus = async (req, res) => {
  const { id } = req.params
  const {
    empStatusName,
    clientId,
    description,
    status
  } = req.body

  let empStatusObj = {
    empStatusName,
    clientId,
    description,
    status
  }

  try {
    const updatedEmpStatus = await empStatusModel.update(empStatusObj, { where: { id } })

    res.status(200).send({ message: 'Updated Employment Status', updatedEmpStatus })
  } catch (error) {
    res.status(500).send({ message: 'Server error', error })
  }
}

//** DELETE EMPLOYMENT STATUS **//
const delEmpStatus = async (req, res) => {
  const { id } = req.params

  const deletedEmpStatus = await empStatusModel.destroy({ where: { id } })

  if(deletedEmpStatus) {
    res.status(200).send({ message: 'Deleted Employment Status', deletedEmpStatus })
  }
  else {
    res.status(200).send({ message: 'No Employment Status deleted' })
  }
}

module.exports = {
  addEmpStatus,
  getEmpStatuses,
  getEmpStatus,
  editEmpStatus,
  delEmpStatus
}
