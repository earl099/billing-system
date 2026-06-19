/**
 * Billing Service
 * Encapsulates business logic for billing operations
 * Separates concerns between HTTP layer and data access layer
 */

import billingModel from '#models/billing.model.js'
import { parsePaginationParams, buildPaginatedResponse } from '#utils/pagination.util.js'
import logger from '#utils/logger.util.js'

export class BillingService {
    /**
     * Get list of billings with pagination
     * @param {Object} query - Query parameters {page, limit}
     * @returns {Promise<Object>} Paginated billing list
     */
    async getBillingList(query) {
        try {
            const { page, limit, skip } = parsePaginationParams(query)

            const list = await billingModel
                .find()
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)

            const total = await billingModel.countDocuments()

            return buildPaginatedResponse(list, total, { page, limit })
        } catch (error) {
            logger.error('Error fetching billing list', { error: error.message })
            throw error
        }
    }

    /**
     * Get single billing record by ID
     * @param {string} code - Client code
     * @param {string} billingId - Billing ID
     * @returns {Promise<Object>} Billing record
     */
    async getBilling(code, billingId) {
        try {
            const billing = await billingModel
                .findById(billingId)
                .populate('createdBy', 'name email')

            if (!billing) {
                throw new Error(`${code.toUpperCase()} Billing not found`)
            }

            return billing
        } catch (error) {
            logger.error('Error fetching billing', { error: error.message, billingId })
            throw error
        }
    }

    /**
     * Delete a billing record
     * @param {string} billingId - Billing ID
     * @param {string} userId - User ID performing deletion (for audit)
     * @returns {Promise<Object>} Deletion result
     */
    async deleteBilling(billingId, userId) {
        try {
            const billing = await billingModel.findByIdAndDelete(billingId)

            if (!billing) {
                throw new Error('Billing record not found')
            }

            logger.warn('Billing deleted', { 
                billingId, 
                userId, 
                clientCode: billing.client 
            })

            return billing
        } catch (error) {
            logger.error('Error deleting billing', { error: error.message, billingId })
            throw error
        }
    }

    /**
     * Create a billing record
     * @param {Object} billingData - Billing data
     * @param {string} userId - User ID creating the record
     * @returns {Promise<Object>} Created billing record
     */
    async createBilling(billingData, userId) {
        try {
            const record = await billingModel.create({
                ...billingData,
                createdBy: userId
            })

            logger.info('Billing created', {
                billingId: record._id,
                clientCode: record.client,
                userId
            })

            return record
        } catch (error) {
            logger.error('Error creating billing', { error: error.message })
            throw error
        }
    }

    /**
     * Update a billing record
     * @param {string} billingId - Billing ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - User ID performing update (for audit)
     * @returns {Promise<Object>} Updated billing record
     */
    async updateBilling(billingId, updateData, userId) {
        try {
            const billing = await billingModel.findByIdAndUpdate(
                billingId,
                updateData,
                { new: true }
            ).populate('createdBy', 'name email')

            if (!billing) {
                throw new Error('Billing record not found')
            }

            logger.info('Billing updated', {
                billingId,
                userId,
                changes: Object.keys(updateData)
            })

            return billing
        } catch (error) {
            logger.error('Error updating billing', { error: error.message, billingId })
            throw error
        }
    }

    /**
     * Get billings for a specific client
     * @param {string} clientCode - Client code
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} Paginated client billings
     */
    async getBillingsByClient(clientCode, query) {
        try {
            const { page, limit, skip } = parsePaginationParams(query)

            const list = await billingModel
                .find({ client: clientCode.toUpperCase() })
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)

            const total = await billingModel.countDocuments({ 
                client: clientCode.toUpperCase() 
            })

            return buildPaginatedResponse(list, total, { page, limit })
        } catch (error) {
            logger.error('Error fetching client billings', { 
                error: error.message, 
                clientCode 
            })
            throw error
        }
    }
}

export default new BillingService()
