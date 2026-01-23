import { Router } from 'express'
import { upload } from '#middleware/upload.middleware.js'
import { acidBillingList, deletePreviews, downloadBilling, generateAcidBilling, getAcidBilling, previewBilling } from '#controllers/acid.controller.js'
import { authMiddleware } from '#middleware/auth.middleware.js'

const acidRouter = Router()

acidRouter.post(
    '/acid/generate',
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]), 
    authMiddleware,
    generateAcidBilling
)


acidRouter.post(
    '/acid/preview',
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]),
    authMiddleware,
    previewBilling
)

acidRouter.post(
    '/acid/cleanup',
    deletePreviews
)

acidRouter.get(
    '/acid/download/:publicId',
    authMiddleware,
    downloadBilling
)

acidRouter.get(
    '/acid/list',
    authMiddleware,
    acidBillingList
)

acidRouter.get(
    '/acid/:_id',
    authMiddleware,
    getAcidBilling
)

export default acidRouter