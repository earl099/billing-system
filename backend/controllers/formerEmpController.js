const db = require('../config/sequelize')
const formerEmpModel = db.formerEmpModel

//** ADD FORMER EMPLOYMENT DETAILS **//
const addFormerEmp = async (req, res) => {
  const {
    empId,
    position,
    otherInfo,
    dateStarted,
    dateEnded
  } = req.body

  const formerEmpObj = {
    empId,
    position,
    otherInfo,
    dateStarted,
    dateEnded
  }

  try {
    const createdFormerEmp = await formerEmpModel.create(formerEmpObj)
    res.status(200).send({ message: 'Former Employment Details created', createdFormerEmp })
  } catch (error) {
    res.status(500).send({ message: 'Server error', error })
  }
}

//** GET FORMER EMPLOYMENT DETAIL RECORDS **//
const getFormerEmps = async (req, res) => {
  const { offset, limit } = req.params

  if(offset == null && limit == null) {
    const formerEmps = await formerEmpModel.findAll()

    if(formerEmps.length < 1) {
      res.status(200).send({ message: 'Former Employment Status Records found', formerEmps })
    }
    else {
      res.status(404).send({ message: 'Former Employment Status Records not found' })
    }
  }
  else {
    const { count, rows } = await formerEmpModel.findAndCountAll({ offset, limit })

    if(count > 0) {
      res.status(200).send({ message: 'Former Employment Status Records found', count, rows })
    }
    else {
      res.status(404).send({ message: 'Former Employment Status Records not found' })
    }
  }
}

//** GET FORMER EMPLOYMENT RECORD **//
const getFormerEmp = async (req, res) => {
  const { id } = req.params

  const formerEmp = await formerEmpModel.findOne({ where: { id } })

  if(formerEmp) {
    res.status(200).send({ message: 'Former Employment Record found', formerEmp })
  }
  else {
    res.status(404).send({ message: 'Former Employment Record not found' })
  }
}

//** EDIT FORMER EMPLOYMENT RECORD **//
const editFormerEmp = async (req, res) => {
  const { id } = req.params
  const {
    empId,
    position,
    otherInfo,
    dateStarted,
    dateEnded
  } = req.body

  const formerEmpObj = {
    empId,
    position,
    otherInfo,
    dateStarted,
    dateEnded
  }

  try {
    const updatedFormerEmp = await formerEmpModel.update(formerEmpObj, { where: { id } })
    res.status(200).send({ message: 'Former Employment Record Updated', updatedFormerEmp })
  } catch (error) {
    res.status(500).send({ message: 'Server Error', error })
  }
}

//** DELETE FORMER EMPLOYMENT RECORD **//
const delFormerEmp = async (req, res) => {
  const { id } = req.params

  const deletedFormerEmp = await formerEmpModel.destroy({ where: { id } })

  if(deletedFormerEmp) {
    res.status(200).send({ message: 'Deleted Former Employment Record', deletedFormerEmp })
  }
  else {
    res.status(404).send({ message: 'No Former Employment Record Deleted' })
  }
}

module.exports = {
  addFormerEmp,
  getFormerEmps,
  getFormerEmp,
  editFormerEmp,
  delFormerEmp
}
