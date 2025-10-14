import User from "../models/User.model.js";
import bcrypt from 'bcrypt'
import sign from "jsonwebtoken/sign.js"; 
import * as crypto from 'crypto'
import createError from "../middleware/error-utils.js";
import config from '../configs/env.js'

const Signup = (req, res, next) => {
    try {
        bcrypt.hash(req.body.password, 10)
        .then(async hashedPass => {
            const count = await User.countDocuments();
            if (count < 1) {
                const user = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: hashedPass,
                    role: 'Admin',
                    handledClients: ['all']
                });
                return user.save()
                    .then((result) => {
                        res.status(201).json({
                            message: 'User created successfully',
                            user: result
                        });
                    })
                    .catch(err => {
                        if (err.code === 11000) {
                            next(createError('Email already exists', 400));
                        }
                        else {
                            next(createError('User creation failed', 500));
                        }
                    });
            }
            else {
                const user_1 = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: hashedPass,
                    role: 'User',
                    handledClients: ['']
                });
                return user_1.save()
                    .then((result_1) => {
                        res.status(201).json({
                            message: 'User created successfully',
                            user: result_1
                        });
                    })
                    .catch(err_1 => {
                        if (err_1.code === 11000) {
                            next(createError('Email already exists', 400));
                        }
                        else {
                            next(createError('User creation failed', 500));
                        }
                    });
            }
        })
    } catch (error) {
        next(error)
    }
}

const Login = (req, res, next) => {
    try {
        let fetchedUser = null
        let accessToken
        
        let expiresInSeconds
        if(req.body.identifier.includes('@')) {
            User.findOne({ email: req.body.identifier })
            .then(user => {
                if(!user) {
                    throw createError('Invalid email or username', 401)
                }

                fetchedUser = user
                console.log(fetchedUser)
                return bcrypt.compareSync(req.body.password, fetchedUser.password)
            })
            .then(result => {
                if(!result) {
                    throw createError('Invalid credentials', 401)
                }

                process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex')

                accessToken = sign(
                    { email: fetchedUser.email, userId: fetchedUser._id },
                    process.env.JWT_SECRET,
                    { expiresIn: config.JWT_EXPIRATION }
                )

                expiresInSeconds = process.env.JWT_EXPIRATION.includes('h')
                ? parseInt(config.JWT_EXPIRATION) * 3600
                : config.JWT_EXPIRATION.includes('m')
                    ? parseInt(config.JWT_EXPIRATION) * 60
                    : 3600;
                
                res.status(200).json({
                    success: true,
                    accessToken,
                    user: fetchedUser,
                    expiresIn: expiresInSeconds
                })
            })
            .catch(err => {
                err.statusCode ? next(err) : next(createError('Authentication failed', 401))
            })
        }
        else {
            User.findOne({ username: req.body.identifier })
            .then(user => {
                if(!user) {
                    throw createError('Invalid email or username', 401)
                }

                fetchedUser = user

                return bcrypt.compareSync(req.body.password, fetchedUser.password)
            })
            .then(result => {
                if(!result) {
                    throw createError('Invalid credentials', 401)
                }

                accessToken = sign(
                    { username: fetchedUser.username, userId: fetchedUser._id },
                    config.JWT_SECRET,
                    { expiresIn: config.JWT_EXPIRATION }
                )

                expiresInSeconds = config.JWT_EXPIRATION.includes('h')
                ? parseInt(config.JWT_EXPIRATION) * 3600
                : config.JWT_EXPIRATION.includes('m')
                    ? parseInt(config.JWT_EXPIRATION) * 60
                    : 3600;

                res.status(200).json({
                    message: 'Auth success',
                    accessToken,
                    user: fetchedUser,
                    expiresIn: expiresInSeconds
                })
            })
            .catch(err => {
                console.log(err)
                err.statusCode ? next(err) : next(createError('Authentication failed', 401))
            })
        }
    } catch (error) {
        next(error)
    }
}

const Logout = (_req, res, _next) => {
    res.status(200).json({ message: 'Logged out successfully' })
}

const getUsers = (req, res, next) => {
    try {
        const pageSize = +req.query.pagesize
        const currentPage = +req.query.page
        const userQuery = User.find()
        let fetchedUsers

        if(pageSize && currentPage) {
            userQuery
            .skip(pageSize * (currentPage - 1))
            .limit(pageSize)
        }

        userQuery
        .then((users) => {
            fetchedUsers = users
            return User.countDocuments()
        })
        .catch(_err => next(createError('Fetching users failed', 500)))
        .then(count => {
            res.status(200).json({
                message: 'User fetched successfully',
                users: fetchedUsers,
                maxCount: count
            })
        })
    } catch (error) {
        next(error)
    }
}

const getUser = (req, res, next) => {
    try {
        const userQuery = User.findById(req.params._id)
        let fetchedUser

        userQuery
        .then((user) => {
            if(user) {
                fetchedUser = user
                res.status(200).json({
                    message: 'User fetched successfully',
                    user: fetchedUser
                })
            }
            else {
                next(createError('User not found', 404))
            }
            
        })
        .catch(_err => next(createError('Fetching user failed', 500)))
    } catch (error) {
        next(error)
    }
}

const updateUser = (req, res, next) => {
    try {
        let newPass
        User.findById({ _id: req.params._id }).then(result => {
            if(req.body.password == result.password) {
                newPass = req.body.password
            }
            else {
                newPass = bcrypt.hash(req.body.password, 10)
            }


            const user = new User({
                _id: req.params._id,
                username: req.body.username,
                email: req.body.email,
                password: newPass
            })

            User.findByIdAndUpdate({ _id: req.params._id }, user)
            .then(result => {
                if(result) {
                    res.status(200).json({ message: 'User updated', user: result })
                }
                else {
                    next(createError('Not authorized to update this user', 401))
                }
            })
            .catch(err => { next(createError('Updating user failed', 500)) })
        })
        
    } catch (error) {
        console.log(error)
        next(error)
    }
}

const deleteUser = (req, res, next) => {
    try {
        User.findByIdAndDelete(req.params._id)
        .then(result => {
            if(result.deletedCount > 0) {
                res.status(200).json({ message: 'Deletion of user successful' })
            }
            else {
                next(createError('Not authorized to delete this user', 401))
            }
        })
        .catch(err => { next(createError('Deleting user failed', 500)) })
    } catch (error) {
        next(error)
    }
}

const userController = { 
    Signup,
    Login,
    Logout,
    getUsers,
    getUser,
    updateUser,
    deleteUser
}

export default userController