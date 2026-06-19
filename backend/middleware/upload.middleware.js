/**
 * @fileoverview File upload middleware using Multer
 * Configures disk storage with timestamped filenames and file type/size validation
 */

import multer from 'multer'
import path from 'path'

/**
 * Multer disk storage configuration
 * Saves files to the 'uploads/' directory with unique timestamped filenames
 * preserving the original file extension
 */
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}${ext}`)
    }
})

/**
 * Multer upload middleware instance
 * - Accepts only .pdf and .docx files
 * - Maximum file size: 10MB
 * - Rejects invalid file types with a descriptive error message
 * 
 * @type {import('multer').Multer}
 * 
 * @example
 * router.post('/upload', upload.single('file'), controller)
 */
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
