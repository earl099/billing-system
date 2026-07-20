/**
 * @fileoverview Backup and restore controller
 * Exports all MongoDB collections to a JSON file and restores them from a JSON backup.
 * Protected by auth + admin middleware at the route level.
 */

import BillingModel from '#models/billing.model.js'
import BillingRateModel from '#models/billingRate.model.js'
import ClientModel from '#models/client.model.js'
import EmployeeModel from '#models/employee.model.js'
import LogModel from '#models/log.model.js'
import PayFreqModel from '#models/payfreq.model.js'
import UserModel from '#models/user.model.js'

/**
 * Ordered list of collections included in a full backup.
 * Order matters for restore: references are preserved because we keep original _id values.
 */
const COLLECTIONS = [
  { key: 'users', model: UserModel },
  { key: 'payFreqs', model: PayFreqModel },
  { key: 'clients', model: ClientModel },
  { key: 'billingRates', model: BillingRateModel },
  { key: 'employees', model: EmployeeModel },
  { key: 'billings', model: BillingModel },
  { key: 'logs', model: LogModel }
]

/**
 * Exports every configured collection to a JSON blob and sends it as a downloadable file.
 */
export async function exportBackup(req, res) {
  try {
    const backup = { exportedAt: new Date().toISOString(), collections: {} }

    for (const { key, model } of COLLECTIONS) {
      backup.collections[key] = await model.find({}).lean()
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `lbs-backup-${timestamp}.json`
    const json = JSON.stringify(backup, null, 2)

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(json)
  } catch (error) {
    console.error('Backup export failed:', error)
    res.status(500).json({ message: 'Failed to export backup', error: error.message })
  }
}

/**
 * Restores the database from an uploaded JSON backup file.
 * Clears each collection present in the backup and re-inserts the documents.
 * Preserves original _id values when they are valid ObjectIds.
 */
export async function importBackup(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Backup file is required' })
    }

    let backup
    try {
      const content = req.file.buffer.toString('utf-8')
      backup = JSON.parse(content)
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid JSON backup file', error: parseError.message })
    }

    if (!backup.collections || typeof backup.collections !== 'object') {
      return res.status(400).json({ message: 'Backup is missing a "collections" object' })
    }

    const results = {}

    for (const { key, model } of COLLECTIONS) {
      const documents = backup.collections[key]

      if (!Array.isArray(documents)) {
        results[key] = { skipped: true, reason: 'Collection not found in backup' }
        continue
      }

      await model.deleteMany({})

      if (documents.length === 0) {
        results[key] = { restored: 0 }
        continue
      }

      await model.insertMany(documents, { ordered: false })
      results[key] = { restored: documents.length }
    }

    res.status(200).json({ message: 'Backup restored successfully', results })
  } catch (error) {
    console.error('Backup restore failed:', error)
    res.status(500).json({ message: 'Failed to restore backup', error: error.message })
  }
}
