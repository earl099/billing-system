"use strict"

const db = require('../config/sequelize')
const departmentModel = db.departmentModel

//** ADDING DEPARTMENT **//
const addDept = async (req, res) => {
  const {
    clientId,
    deptCode,
    deptName,
    description,
    status
  } = req.body
  
  const dept = {
    clientId,
    deptCode,
    deptName,
    description,
    status
  }

  try {
    const createdDept = await departmentModel.create(dept)
    res.status(200).send({ message: 'Department created', createdDept: createdDept })
  } catch (e) {
    res.status(500).send({ message: 'Server error', error: e })
  }
}

//** GETTING DEPARTMENTS **//
const getDepts = async (req, res) => {
  const { offset, limit } = req.body

  if((offset != null || offset != undefined) && (limit != null || limit != undefined)) {
    const { count, rows } = await departmentModel.findAndCountAll({
      offset: offset,
      limit: limit
    })

    if(depts.length < 1) {
      res.status(200).send({ message: 'No Departments found' })
    }
    else {
      res.status(200).send({ message: 'Departments found', count, rows })
    }
  }
  else {
    const depts = await departmentModel.findAll()

    if(depts.length < 1) {
      res.status(200).send({ message: 'No Departments found' })
    }
    else {
      res.status(200).send({ message: 'Departments found', depts })
    }
  }
}

//** GET DEPARTMENT **//
const getDept = async (req, res) => {
  const { id } = req.params

  let dept = await departmentModel.findOne({ where: { id } })

  if(dept) {
    res.status(200).send({ message: 'Department found', dept })
  }
  else {
    res.status(200).send({ message: 'No Department found.' })
  }
}

//** EDIT DEPARTMENT **//
const editDept = async (req, res) => {
  const { id } = req.params

  const {
    clientId,
    deptCode,
    deptName,
    description,
    status
  } = req.body

  const deptObj = {
    clientId,
    deptCode,
    deptName,
    description,
    status
  }

  try {
    const updatedDept = await departmentModel.update(deptObj, { where: { id } })

    res.status(200).send({ message: 'Updated Department successfully', updatedDept })
  } catch (error) {
    res.status(500).send({ message: 'Server Error', error })
  }
}

//** DELETE DEPARTMENT **//
const delDept = async (req, res) => {
  const { id } = req.params

  const deletedDept = await departmentModel.destroy({ where: { id } })

  if(deletedDept) {
    res.status(200).send({ message: 'Deleted department', deletedDept })
  }
  else {
    res.status(404).send({ message: 'No department deleted.' })
  }
}

module.exports = {
  addDept,
  getDepts,
  getDept,
  editDept,
  delDept
}
