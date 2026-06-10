import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}${ext}`)
    }
})

export const upload = multer({
    storage,
    fileFilter: (_, file, cb) => {
        const allowed = ['.pdf', '.docx']
        const ext = path.extname(file.originalname).toLowerCase()
        if (allowed.includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error(`Invalid file type. Allowed: ${allowed.join(', ')}`))
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024  // 10MB limit
    }
})