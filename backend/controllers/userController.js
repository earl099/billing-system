"use strict";

//** REQUIRED IMPORTS FOR DATABASE **/
const db = require("../config/sequelize");
const userModel = db.userModel;
const authConfig = require("../config/authConfig");

//** IMPORTS FOR USER LOGIN **/
const jwt = require("jsonwebtoken");
const crypto = require('crypto')

//** ADD USER FUNCTION **/
const addUser = async (req, res) => {
  const { email, username, password, userType } = req.body;

  //hash password and save in db
  let passwordHash = authConfig.encryptPass(password);

  //data preparation for database insertion
  let user = {
    email,
    username,
    password: passwordHash,
    userType,
  };

  //query for inserting in database
  try {
    //will check if user is an admin account
    if(user.userType == 'Admin') {
      Object.assign(user, {
        //ACCOUNT ACCESS
        viewAcct: true,
        addAcct: true,
        editAcct: true,
        delAcct: true,

        //PAY FREQUENCY ACCESS
        viewPayF: true,
        addPayF: true,
        editPayF: true,
        delPayF: true,

        //CLIENT ACCESS
        viewClient: true,
        addClient: true,
        editClient: true,
        delClient: true,

        //EMPLOYEE ACCESS
        viewEmp: true,
        addEmp: true,
        editEmp: true,
        delEmp: true,

        //CLASSIFICATION ACCESS
        viewClass: true,
        addClass: true,
        editClass: true,
        delClass: true,

        //DEPARTMENT ACCESS
        viewDept: true,
        addDept: true,
        editDept: true,
        delDept: true,

        //POSITION ACCESS
        viewPos: true,
        addPos: true,
        editPos: true,
        delPos: true,

        //LOCATION ACCESS
        viewLoc: true,
        addLoc: true,
        editLoc: true,
        delLoc: true,

        //WAGE ACCESS
        viewWage: true,
        addWage: true,
        editWage: true,
        delWage: true
      })
    }
    const createdUser = await userModel.create(user);
    res
      .status(201)
      .send({ createdUser, message: "Account Added" });
  } catch (err) {
    res.status(400).send({ message: "Account already exists.", error: err });
  }
};

//** GET USERS FUNCTION **/
const getUsers = async (req, res) => {
  const { offset, limit } = req.params

  if((limit == NaN || limit == undefined) && (offset == NaN || offset == undefined)) {
    const users = await userModel.findAll();

    if (users.length > 0) {
      res.status(200).json({ message: "Users found.", users });
    } else {
      res.status(200).json({ message: "No Users found." });
    }
  }
  else {
    const { count, rows } = await userModel.findAndCountAll({
      offset: Number(offset),
      limit: Number(limit)
    });

    try {
      res.status(200).json({ message: "Users found.", count, rows });
    } catch (e) {
      res.status(500).send({ message: 'Server Error', error: e })
    }
  }
};

//** GET ONE USER **//
const getUser = async (req, res) => {
  const { id } = req.params

  let user = await userModel.findOne({ where: { id } })

  if(user) {
    res.status(200).send({ message: 'User Found', user })
  }
  else {
    res.status(200).send({ message: 'No User Found' })
  }
}

//** EDIT USER DETAILS **//
const editDetails = async (req, res) => {
  const { id } = req.params
  const { username, email, password } = req.body

  let user = await userModel.findOne({ where: { id } })
  let userDetObj
  if(user.password == password) {
    userDetObj = {
      username,
      email
    }
  }
  else {
    let passwordHash = authConfig.encryptPass(password)
    userDetObj = {
      username,
      password: passwordHash,
      email
    }
  }


  const updatedUserDet = await userModel.update(userDetObj, { where: { id } })

  if(updatedUserDet) {
    res.status(200).send({ message: 'User details updated successfully.', updatedUserDet })
  }
  else {
    res.status(500).send({ message: 'Server error' })
  }


}

//** EDIT USER ACCESS **//
const editAccess = async (req, res) => {
  const { id } = req.params
  const {
    //ACCOUNT ACCESS
    viewAcct,
    addAcct,
    editAcct,
    delAcct,

    //PAY FREQUENCY ACCESS
    viewPayF,
    addPayF,
    editPayF,
    delPayF,

    //CLIENT ACCESS
    viewClient,
    addClient,
    editClient,
    delClient,

    //EMPLOYEE ACCESS
    viewEmp,
    addEmp,
    editEmp,
    delEmp,

    //CLASSIFICATION ACCESS
    viewClass,
    addClass,
    editClass,
    delClass,

    //DEPARTMENT ACCESS
    viewDept,
    addDept,
    editDept,
    delDept,

    //POSITION ACCESS
    viewPos,
    addPos,
    editPos,
    delPos,

    //LOCATION ACCESS
    viewLoc,
    addLoc,
    editLoc,
    delLoc,

    //WAGE ACCESS
    viewWage,
    addWage,
    editWage,
    delWage,
  } = req.body

  const updatedUserAccObj = {
    viewAcct,
    addAcct,
    editAcct,
    delAcct,

    viewPayF,
    addPayF,
    editPayF,
    delPayF,

    viewClient,
    addClient,
    editClient,
    delClient,

    viewEmp,
    addEmp,
    editEmp,
    delEmp,

    viewClass,
    addClass,
    editClass,
    delClass,

    viewDept,
    addDept,
    editDept,
    delDept,

    viewPos,
    addPos,
    editPos,
    delPos,

    viewLoc,
    addLoc,
    editLoc,
    delLoc,

    viewWage,
    addWage,
    editWage,
    delWage,
  }

  try {
    const updatedUserAcc = await userModel.update(updatedUserAccObj, { where: { id } })
    res.status(200).send({ message: 'User access updated successfully.', updatedUserAcc })
  } catch (error) {
    res.status(500).send({ message: 'Server error', error })
  }
}

//** DELETE USER **//
const delUser = async (req, res) => {
  const { id } = req.params

  const deletedUser = await userModel.destroy({ where: { id } })

  if(deletedUser) {
    res.status(200).send({ message: 'User Deleted Successfully', deletedUser })
  }
  else {
    res.status(404).send({ message: 'User not found.' })
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
  editDetails,
  editAccess,
  delUser,
  login
};
