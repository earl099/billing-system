import { Router } from 'express'
import { upload } from '#middleware/upload.middleware.js'
import { generateAcidBilling, previewBilling } from '#controllers/acid.controller.js'
import { authMiddleware } from '#middleware/auth.middleware.js'

const acidRouter = Router()

acidRouter.post(
    '/acid/generate',
    authMiddleware,
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]), generateAcidBilling
)


acidRouter.post(
    '/acid/preview',
    authMiddleware,
    upload.fields([
        { name: 'billingLetter', maxCount: 1 },
        { name: 'attachments', maxCount: 50 }
    ]),
    previewBilling
)

export default acidRouter