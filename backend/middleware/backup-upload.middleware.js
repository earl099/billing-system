/**
 * @fileoverview Backup file upload middleware
 * Accepts JSON backup files uploaded through multer.
 */

import multer from 'multer'
import path from 'path'

/**
 * Multer memory storage configuration for backup uploads.
 * Files are kept in memory so the controller can parse them immediately.
 */
const storage = multer.memoryStorage()

/**
 * Multer upload middleware instance for backup/restore operations
 * - Accepts only .json files
 * - Maximum file size: 50MB
 *
 * @type {import('multer').Multer}
 */
export const backupUpload = multer({
    storage,
    fileFilter: (_, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        if (ext === '.json') {
            cb(null, true)
        } else {
            cb(new Error('Invalid file type. Only .json backup files are allowed.'))
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024  // 50MB limit
    }
})
