import multer from 'multer'
import { v4 as uuid } from 'uuid'

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (_, file, cb) => {
        cb(null, `${uuid()}-${file.originalname}`)
    }
})

export const upload = multer({
    storage,
    fileFilter: (_, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
        cb(null, allowed.includes(file.mimetype))
    }
})