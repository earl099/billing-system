"use strict";

//** REQUIRED IMPORTS FOR DATABASE **/
const db = require("../config/sequelize");
const userModel = db.userModel;
const authConfig = require("../config/authConfig");

//** IMPORTS FOR USER LOGIN **/
const jwt = require("jsonwebtoken");
const crypto = require('crypto')
const { Sequelize } = require('../config/sequelize')

//** ADD USER FUNCTION **/
const addUser = async (req, res) => {
  const { email, username, password, userType } = req.body;

  //hash password and save in db
  let passwordHash = authConfig.encryptPass(password);

  //data preparation for database insertion
  const user = {
    email: email,
    username: username,
    password: passwordHash,
    userType: userType,
  };

  //query for inserting in database
  try {
    const createdUser = await userModel.create(user);
    res
      .status(201)
      .send({ createdUser: createdUser, message: "Account Added" });
  } catch (err) {
    res.status(400).send({ message: "Account already exists.", error: err });
  }
};

//** GET USERS FUNCTION **/
const getUsers = async (req, res) => {
  const users = await userModel.findAll({
    attributes: ["username", "email", "password", "userType"],
  });

  if (users.length > 0) {
    res.status(200).json({ message: "Users found.", users: users });
  } else {
    res.status(200).json({ message: "No Users found.", users: users });
  }
};

//** GET ONE USER **//
const getUser = async (req, res) => {
  const { emailOrUser } = req.body

  if(emailOrUser.includes('@')) {
    try {
      const user = await userModel.findOne({
        attributes: ['email', 'password', 'userType'],
        where: { email: emailOrUser }
      })

      if(user != null) {
        res.status(200).send({ message: 'User found.', user: user })
      }
      else {
        res.status(400).send({ message: 'No user found.' })
      }
    }
    catch (error) {
      res.status(500).send({ message: 'Server Error' })
    }
  }
  else {
    try {
      const user = await userModel.findOne({
        attributes: ['username', 'password', 'userType'],
        where: { username: emailOrUser }
      })

      if(user != null) {
        res.status(200).send({ message: 'User found.', user: user })
      }
      else {
        res.status(400).send({ message: 'No user found.' })
      }
    } catch (error) {
      res.status(500).send({ message: 'Server Error' })
    }

  }
}

//** LOGIN FUNCTION **/
const login = async (req, res) => {

  const { emailOrUser, password } = req.body
  let passwordMatchFlag
  let keyMaker

  //find email then login to page
  if(emailOrUser.includes('@')) {
    try {
      const user = await userModel.findOne({
        attributes: ['email', 'password', 'userType'],
        where: { email: emailOrUser }
      })

      if(user) {
        passwordMatchFlag = authConfig.comparePass(password, user.password)
        if(passwordMatchFlag) {
          keyMaker = crypto.randomBytes(32).toString('hex')
          process.env.JWT_LOGIN_TOKEN = keyMaker
          const jwToken = jwt.sign({ email: user.email, userType: user.userType }, process.env.JWT_LOGIN_TOKEN, { expiresIn: '1h' })
          return res.status(200).send({ message: 'Logged in successfully', user, jwToken, expirationDuration: 3600 })
        }
        else {
          return res.status(400).send({ message: 'Wrong credentials.' })
        }
      }
      else {
        return res.status(400).send({ message: 'No user found.' })
      }
    } catch (e) {
      res.status(500).send({ message: 'Server error.', error: e })
    }
  }
  else {
    //find username then login to page
    try {
      const user = await userModel.findOne({
        attributes: ['username', 'password', 'userType'],
        where: { username: emailOrUser }
      })

      if(user != null) {
        passwordMatchFlag = authConfig.comparePass(password, user.password)

        if(passwordMatchFlag) {
          keyMaker = crypto.randomBytes(32).toString('hex')
          process.env.JWT_LOGIN_TOKEN = keyMaker
          const jwToken = jwt.sign({ username: user.username, userType: user.userType }, process.env.JWT_LOGIN_TOKEN, { expiresIn: '1h' })
          return res.status(200).send({ message: 'Logged in successfully', user, jwToken, expirationDuration: 3600 })
        }
        else {
          return res.status(400).send({ message: 'Wrong credentials.' })
        }
      }
      else {
        return res.status(400).send({ message: 'No user found.' })
      }
    } catch (e) {
      return res.status(500).send({ message: 'Server error' })
    }
  }
}

module.exports = {
  addUser,
  getUsers,
  getUser,
  login
};
