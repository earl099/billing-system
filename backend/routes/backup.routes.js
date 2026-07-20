/**
 * @fileoverview Backup and restore routes
 * Admin-only endpoints for exporting and importing the full database backup.
 */

import { Router } from 'express'
import { exportBackup, importBackup } from '#controllers/backup.controller.js'
import { authMiddleware } from '#middleware/auth.middleware.js'
import { adminMiddleware } from '#middleware/admin.middleware.js'
import { backupUpload } from '#middleware/backup-upload.middleware.js'

const backupRouter = Router()

/** All backup routes require authentication and Admin role */
backupRouter.use(authMiddleware, adminMiddleware)

backupRouter.get('/backup/export', exportBackup)
backupRouter.post('/backup/import', backupUpload.single('file'), importBackup)

export default backupRouter
