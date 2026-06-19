/**
 * User Service
 * Encapsulates business logic for user operations
 */

import userModel from '#models/user.model.js'
import logger from '#utils/logger.util.js'
import bcrypt from 'bcrypt'

export class UserService {
    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} {isValid, errors}
     */
    validatePasswordStrength(password) {
        const errors = []

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters')
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter')
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter')
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number')
        }
        if (!/[!@#$%^&*]/.test(password)) {
            errors.push('Password must contain at least one special character (!@#$%^&*)')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    /**
     * Create user with password hashing
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        try {
            // Validate password strength
            const passwordValidation = this.validatePasswordStrength(userData.password)
            if (!passwordValidation.isValid) {
                const error = new Error('Password does not meet requirements')
                error.errors = passwordValidation.errors
                throw error
            }

            // Hash password
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(userData.password, salt)

            const user = await userModel.create({
                ...userData,
                password: hashedPassword
            })

            logger.info('User created', {
                userId: user._id,
                username: user.username,
                role: user.role
            })

            return user
        } catch (error) {
            logger.error('Error creating user', { error: error.message })
            throw error
        }
    }

    /**
     * Update user (cannot update password via this method)
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update (excluding password)
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, updateData) {
        try {
            // Prevent password updates via this method
            const { password, ...safeData } = updateData

            const user = await userModel.findByIdAndUpdate(
                userId,
                safeData,
                { new: true, runValidators: true }
            )

            if (!user) {
                throw new Error('User not found')
            }

            logger.info('User updated', {
                userId,
                changes: Object.keys(safeData)
            })

            return user
        } catch (error) {
            logger.error('Error updating user', { error: error.message, userId })
            throw error
        }
    }

    /**
     * Get user by ID (excludes password)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User data
     */
    async getUser(userId) {
        try {
            const user = await userModel
                .findById(userId)
                .select('-password')

            if (!user) {
                throw new Error('User not found')
            }

            return user
        } catch (error) {
            logger.error('Error fetching user', { error: error.message, userId })
            throw error
        }
    }

    /**
     * Delete user
     * @param {userId} userId - User ID to delete
     * @returns {Promise<Object>} Deleted user
     */
    async deleteUser(userId) {
        try {
            const user = await userModel.findByIdAndDelete(userId)

            if (!user) {
                throw new Error('User not found')
            }

            logger.warn('User deleted', {
                userId,
                username: user.username
            })

            return user
        } catch (error) {
            logger.error('Error deleting user', { error: error.message, userId })
            throw error
        }
    }

    /**
     * Verify password
     * @param {string} plainPassword - Plain text password
     * @param {string} hashedPassword - Hashed password from DB
     * @returns {Promise<boolean>} Password matches
     */
    async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword)
        } catch (error) {
            logger.error('Error verifying password', { error: error.message })
            return false
        }
    }
}

export default new UserService()
