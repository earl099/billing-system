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
    '/:code/generate',
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]), 
    authMiddleware,
    generateBilling
)


billingRouter.post(
    '/:code/preview',
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]),
    authMiddleware,
    previewBilling
)

billingRouter.post(
    '/:code/cleanup',
    deletePreviews
)

billingRouter.get(
    '/:code/download/:publicId',
    authMiddleware,
    downloadBilling
)

billingRouter.get(
    '/:code/list',
    authMiddleware,
    billingList
)

billingRouter.get(
    '/:code/:_id',
    authMiddleware,
    getBilling
)

billingRouter.delete(
    '/:code/:_id',
    authMiddleware,
    deleteBilling
)

//FOR TRUNCATING THE DB ONLY, IT WILL ONLY USE THIS
billingRouter.delete(
    '/:code',
    authMiddleware,
    clearBilling
)

export default billingRouter