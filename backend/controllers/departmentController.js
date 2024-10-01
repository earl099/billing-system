"use strict"

const db = require('../config/sequelize')
const departmentModel = db.departmentModel

//** ADDING DEPARTMENT **//
const addDept = async (req, res) => {
  const { clientId, deptName } = req.body
  const dept = {
    clientId: clientId,
    deptName: deptName
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

  const depts = await departmentModel.findAll({
    attributes: [
      'clientId',
      'deptName'
    ],
    offset: offset,
    limit: limit
  })

  if(depts.length < 1) {
    res.status(200).send({ message: 'No Departments found' })
  }
  else {
    res.status(200).send({ message: 'Departments found', depts: depts })
  }
}

module.exports = {
  addDept,
  getDepts
}
