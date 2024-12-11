const jwt = require('jsonwebtoken')
const db = require('../config/sequelize')
const userModel = db.user

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    const decodedToken = jwt.verify(token, process.env.JWT_PRIVATE_KEY)
    const user = await userModel.findOne({
      attributes: ['email', 'username', 'password'],
      where: {username: decodedToken.username}
    })

    if(!user) {
      throw new Error()
    }

    req.token = token
    req.user = user
    next()
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' })
  }
}

module.exports = auth
