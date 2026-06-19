/**
 * @fileoverview Billing routes
 * Defines endpoints for billing letter generation, preview, download, and CRUD operations
 * All routes require authentication via authMiddleware
 */

import { Router } from 'express'
import { upload } from '#middleware/upload.middleware.js'
import {
    billingList,
    deleteBilling,
    deletePreviews,
    downloadBilling,
    generateBilling,
    getBilling,
    previewBilling
} from '#controllers/billing.controller.js'
import { authMiddleware } from '#middleware/auth.middleware.js'

const billingRouter = Router()

/** POST /billing/:code/generate - Generate final merged billing PDF */
billingRouter.post(
    '/billing/:code/generate',
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]), 
    authMiddleware,
    generateBilling
)

/** POST /billing/:code/preview - Upload and preview billing letter + attachments */
billingRouter.post(
    '/billing/:code/preview',
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]),
    authMiddleware,
    previewBilling
)

/** POST /billing/:code/cleanup - Delete preview files from Cloudinary */
billingRouter.post(
    '/billing/:code/cleanup',
    authMiddleware,
    deletePreviews
)

/** GET /billing/:code/download/:publicId - Download billing PDF by Cloudinary public ID */
billingRouter.get(
    '/billing/:code/download/:publicId',
    authMiddleware,
    downloadBilling
)

/** GET /billing/:code/list - List all billing records with pagination */
billingRouter.get(
    '/billing/:code/list',
    authMiddleware,
    billingList
)

/** GET /billing/:code/:_id - Get single billing record by ID */
billingRouter.get(
    '/billing/:code/:_id',
    authMiddleware,
    getBilling
)

/** DELETE /billing/:code/:_id - Delete billing record by ID */
billingRouter.delete(
    '/billing/:code/:_id',
    authMiddleware,
    deleteBilling
)

// SECURITY: Destructive endpoint disabled
// Truncating entire billing table is too dangerous
// Enable only in isolated development/testing environments with admin confirmation
// billingRouter.delete('/billing/:code', authMiddleware, adminMiddleware, clearBilling)

export default billingRouter
