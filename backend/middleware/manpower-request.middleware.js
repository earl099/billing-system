/**
 * @fileoverview Validates client workbook selectors before building Graph API paths.
 */

const TABLE_NAMES = new Set(['EmployeeTable', 'PositionTable'])

export function validateManpowerRequest(req, res, next) {
    const { fileName, tableName } = req.query
    if (
        typeof fileName !== 'string' ||
        fileName.length > 255 ||
        fileName.includes('..') ||
        /[\\/\0-\x1f]/.test(fileName) ||
        !/\.xls[mx]$/i.test(fileName)
    ) {
        return res.status(400).json({ message: 'Invalid workbook file name' })
    }

    if (typeof tableName !== 'string' || !TABLE_NAMES.has(tableName)) {
        return res.status(400).json({ message: 'Invalid workbook table name' })
    }

    if (req.params.index !== undefined && !/^(0|[1-9]\d{0,5})$/.test(req.params.index)) {
        return res.status(400).json({ message: 'Invalid workbook row index' })
    }

    next()
}
