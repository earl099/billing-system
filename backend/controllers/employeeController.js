"use strict"

const db = require('../config/sequelize')
const employeeModel = db.employeeModel

//** ADD EMPLOYEE **//
const addEmployee = async (req, res) => {
  const {
    employeeId,
    clientId,
    firstName,
    middleName,
    lastName,
    suffix,
    gender,
    dateOfBirth,
    education,
    deptId,
    locId,
    email1,
    email2,
    mobileNum1,
    mobileNum2,
    civilStatus,
    posId,
    employmentStatus,
    remarks,
    wageId
  } = req.body

  const employeeObj = {
    employeeId,
    clientId,
    firstName,
    middleName,
    lastName,
    suffix,
    gender,
    dateOfBirth,
    education,
    deptId,
    locId,
    email1,
    email2,
    mobileNum1,
    mobileNum2,
    civilStatus,
    posId,
    employmentStatus,
    remarks,
    wageId
  }

  try {
    const createdEmployee = await employeeModel.create(employeeObj)
    res.status(200).send({ message: 'Employee created', createdEmployee })
  } catch (e) {
    res.status(500).send({ message: 'Server error', error: e })
  }
}

//** GET EMPLOYEES **//
const getEmployees = async (req, res) => {
  const { offset, limit } = req.body

  if((offset != null || offset != undefined) && (limit != null || limit != undefined)) {
    const { rows, count } = await employeeModel.findAndCountAll({
      offset,
      limit
    })

    if(count < 1) {
      res.status(200).send({ message: 'No employees found' })
    }
    else {
      res.status(200).send({ message: 'Employees found', rows, count })
    }
  }
  else {
    const emps = await employeeModel.findAll()

    if(emps.length < 1) {
      res.status(200).send({ message: 'No employees found.' })
    }
    else {
      res.status(200).send({ message: 'Employees found', emps })
    }
  }
}

//** GET EMPLOYEE **//
const getEmployee = async (req, res) => {
  const { id } = req.params

  const emp = await employeeModel.findOne({ where: { id } })

  if(emp) {
    res.status(200).send({ message: 'Employee found', emp })
  }
  else {
    res.status(200).send({ message: 'No Employee found' })
  }
}

//** EDIT EMPLOYEE **//
const editEmployee = async (req, res) => {
  const { id } = req.params
  const {
    employeeId,
    clientId,
    firstName,
    middleName,
    lastName,
    suffix,
    gender,
    dateOfBirth,
    education,
    deptId,
    locId,
    email1,
    email2,
    mobileNum1,
    mobileNum2,
    civilStatus,
    posId,
    employmentStatus,
    remarks,
    wageId
  } = req.body

  const empObj = {
    employeeId,
    clientId,
    firstName,
    middleName,
    lastName,
    suffix,
    gender,
    dateOfBirth,
    education,
    deptId,
    locId,
    email1,
    email2,
    mobileNum1,
    mobileNum2,
    civilStatus,
    posId,
    employmentStatus,
    remarks,
    wageId
  }

  try {
    const updatedEmp = await employeeModel.update(empObj, { where: { id } })

    res.status(200).send({ message: 'Updated Employee successfully', updatedEmp })
  } catch (error) {
    res.status(500).send({ message: 'Server Error', error })
  }
}

//** DELETE EMPLOYEE **//
const delEmployee = async (req, res) => {
  const { id } = req.params

  const deletedEmp = await employeeModel.destroy({ where: { id } })

  if(deletedEmp) {
    res.status(200).send({ message: 'Deleted Employee Successfully', deletedEmp })
  }
  else {
    res.status(404).send({ message: 'No Employee deleted' })
  }
}

module.exports = {
  addEmployee,
  getEmployees,
  getEmployee,
  editEmployee,
  delEmployee
}
