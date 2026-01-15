import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}-${file.originalname}${ext}`)
    }
})

export const upload = multer({
    storage,
    fileFilter: (_, file, cb) => {
        const allowed = ['.pdf', '.docx']
        allowed.includes(path.extname(file.originalname).toLowerCase())
        ? cb(null, true)
        : cb(new Error('Invalid file type'))
    }
})