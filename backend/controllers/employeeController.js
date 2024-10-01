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
    departmentId,
    locationId,
    email1,
    email2,
    mobileNum1,
    mobileNum2,
    civilStatus,
    positionId,
    employmentStatus,
    remarks,
    wageId
  } = req.body

  const employeeObj = {
    employeeId: employeeId,
    clientId: clientId,
    firstName: firstName,
    middleName: middleName,
    lastName: lastName,
    suffix: suffix,
    gender: gender,
    dateOfBirth: dateOfBirth,
    education: education,
    departmentId: departmentId,
    locationId: locationId,
    email1: email1,
    email2: email2,
    mobileNum1: mobileNum1,
    mobileNum2: mobileNum2,
    civilStatus: civilStatus,
    positionId: positionId,
    employmentStatus: employmentStatus,
    remarks: remarks,
    wageId: wageId
  }

  try {
    const createdEmployee = await employeeModel.create(employeeObj)
    res.status(200).send({ message: 'Employee created', createdEmployee: createdEmployee })
  } catch (e) {
    res.status(500).send({ message: 'Server error', error: e })
  }
}

//** GET EMPLOYEES **//
const getEmployees = async (req, res) => {
  const { offset, limit } = req.body

  const employees = await employeeModel.findAll({
    attributes: [
      'employeeId',
      'clientId',
      'firstName',
      'middleName',
      'lastName',
      'suffix',
      'gender',
      'dateOfBirth',
      'education',
      'departmentId',
      'locationId',
      'email1',
      'email2',
      'mobileNum1',
      'mobileNum2',
      'civilStatus',
      'positionId',
      'employmentStatus',
      'remarks',
      'wageId'
    ],
    offset: offset,
    limit: limit
  })

  if(employees.length < 1) {
    res.status(200).send({ message: 'No employees found.' })
  }
  else {
    res.status(200).send({ message: 'Employees found', employees: employees })
  }
}

module.exports = {
  addEmployee,
  getEmployees
}
