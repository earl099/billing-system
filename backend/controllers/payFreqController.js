"use strict"

const db = require('../config/sequelize')
const payFreqModel = db.payFreqModel

//** ADDING PAY FREQUENCY **//
const addPayFreq = async (req, res) => {
  const { payType } = req.body

  const payTypeObj = {
    payType: payType
  }

  try {
    payFreqModel.create(payTypeObj)
    res.status(200).send({ message: 'Pay Frequency created.', payTypeObj: payTypeObj })
  } catch (e) {
    res.status(500).send({ message: 'Server Error' })
  }
}

//** GET PAY FREQUENCIES **//
const getPayFreqs = async (req, res) => {
  const payFreqs = await payFreqModel.findAll()

  if(payFreqs.length < 1) {
    res.status(200).send({ message: 'No Pay Frequencies found' })
  }
  else {
    res.status(200).send({ message: 'Pay Frequencies found', payFreqs: payFreqs })
  }
}

//** GET PAY FREQUENCY **//
const getPayFreq = async (req, res) => {
  const id = req.params.id

  let payFreq = await payFreqModel.findOne({ where: { id: id } })

  if(payFreq) {
    res.status(200).send({ message: 'Pay Frequency Found', payFreq: payFreq })
  }
  else {
    res.status(200).send({ message: 'No Pay Frequency Found.' })
  }
}

//** EDIT PAY FREQUENCY **//
const editPayFreq = async (req, res) => {

}


//** DELETE PAY FREQUENCY **//
const deletePayFreq = async (req, res) => {

}

module.exports = {
  addPayFreq,
  getPayFreqs,
  getPayFreq,
  editPayFreq,
  deletePayFreq
}
