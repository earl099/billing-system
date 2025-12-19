import { Router } from 'express'
import { upload } from '../middleware/upload.middleware.js'
import { generate } from '../controllers/acid.controller.js'

const acidRouter = Router()

acidRouter.post('/acid/generate', upload.array('files'), generate)