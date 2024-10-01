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

//** GET PAY FREQUENCIES */
const getPayFreqs = async (req, res) => {
  const payFreqs = await payFreqModel.findAll({
    attributes: [
      'id', 'payType'
    ]
  })

  if(payFreqs.length < 1) {
    res.status(200).send({ message: 'No Pay Frequencies found' })
  }
  else {
    res.status(200).send({ message: 'Pay Frequencies found', payFreqs: payFreqs })
  }
}

module.exports = {
  addPayFreq,
  getPayFreqs
}
