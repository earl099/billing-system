import { Router } from 'express'
import { upload } from '#middleware/upload.middleware.js'
import {
    billingList,
    clearBilling,
    deleteBilling,
    deletePreviews,
    downloadBilling,
    generateBilling,
    getBilling,
    previewBilling
} from '#controllers/billing.controller.js'
import { authMiddleware } from '#middleware/auth.middleware.js'

const billingRouter = Router()

billingRouter.post(
    '/billing/:code/generate',
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]), 
    authMiddleware,
    generateBilling
)


billingRouter.post(
    '/billing/:code/preview',
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]),
    authMiddleware,
    previewBilling
)

billingRouter.post(
    '/billing/:code/cleanup',
    deletePreviews
)

billingRouter.get(
    '/billing/:code/download/:publicId',
    authMiddleware,
    downloadBilling
)

billingRouter.get(
    '/billing/:code/list',
    authMiddleware,
    billingList
)

billingRouter.get(
    '/billing/:code/:_id',
    authMiddleware,
    getBilling
)

billingRouter.delete(
    '/billing/:code/:_id',
    authMiddleware,
    deleteBilling
)

//FOR TRUNCATING THE DB ONLY, IT WILL ONLY USE THIS
billingRouter.delete(
    '/billing/:code',
    authMiddleware,
    clearBilling
)

export default billingRouter