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
import { clientAccessMiddleware } from '#middleware/client-access.middleware.js'
import { uploadLimiter } from '#middleware/rateLimit.middleware.js'

const billingRouter = Router()

/** Authenticate before route-level client checks and file parsing. */
billingRouter.use(authMiddleware)

/** POST /billing/:code/generate - Generate final merged billing PDF */
billingRouter.post(
    '/billing/:code/generate',
    clientAccessMiddleware,
    uploadLimiter,
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 10 }
    ]),
    generateBilling
)

/** POST /billing/:code/preview - Upload and preview billing letter + attachments */
billingRouter.post(
    '/billing/:code/preview',
    clientAccessMiddleware,
    uploadLimiter,
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 10 }
    ]),
    previewBilling
)

/** POST /billing/:code/cleanup - Delete preview files from Cloudinary */
billingRouter.post(
    '/billing/:code/cleanup',
    clientAccessMiddleware,
    deletePreviews
)

/** GET /billing/:code/download/:publicId - Download billing PDF by Cloudinary public ID */
billingRouter.get(
    '/billing/:code/download/:publicId',
    clientAccessMiddleware,
    downloadBilling
)

/** GET /billing/:code/list - List all billing records with pagination */
billingRouter.get(
    '/billing/:code/list',
    clientAccessMiddleware,
    billingList
)

/** GET /billing/:code/:_id - Get single billing record by ID */
billingRouter.get(
    '/billing/:code/:_id',
    clientAccessMiddleware,
    getBilling
)

/** DELETE /billing/:code/:_id - Delete billing record by ID */
billingRouter.delete(
    '/billing/:code/:_id',
    clientAccessMiddleware,
    deleteBilling
)

// SECURITY: Destructive endpoint disabled
// Truncating entire billing table is too dangerous
// Enable only in isolated development/testing environments with admin confirmation
// billingRouter.delete('/billing/:code', authMiddleware, adminMiddleware, clearBilling)

export default billingRouter
