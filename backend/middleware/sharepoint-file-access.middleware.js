/**
 * @fileoverview Restricts SharePoint file operations to the file's assigned client.
 */

import { graphRequest } from '#utils/graphClient.js'
import clientModel from '#models/client.model.js'

const FILE_ID_PARAMS = ['id', 'fileId', 'timekeepingId', 'billingId']

async function getSharePointItemPath(siteId, itemId) {
    const response = await graphRequest(
        'GET',
        `/sites/${siteId}/drive/items/${encodeURIComponent(itemId)}?$select=id,parentReference`
    )
    return response.data.parentReference?.path
}

export async function sharepointFileAccessMiddleware(req, res, next) {
    if (req.user?.role === 'Admin') {
        return next()
    }

    const fileIds = [...new Set(FILE_ID_PARAMS
        .map(param => req.params[param])
        .filter(Boolean))]
    if (!fileIds.length) {
        return res.status(400).json({ message: 'SharePoint file ID is required' })
    }

    try {
        const siteId = process.env.SHAREPOINT_SITE_ID
        if (!siteId) {
            throw new Error('SHAREPOINT_SITE_ID environment variable is required')
        }

        for (const fileId of fileIds) {
            const drivePath = await getSharePointItemPath(siteId, fileId)
            const pathMatch = typeof drivePath === 'string'
                ? drivePath.match(/\/root:\/(Templates|BillingLetterDrafts)\/([^/]+)(?:\/|$)/i)
                : null

            if (!pathMatch) {
                return res.status(403).json({ message: 'SharePoint file is outside an authorized client folder' })
            }

            const clientCode = decodeURIComponent(pathMatch[2]).toUpperCase()
            const client = await clientModel.findOne({ code: clientCode }).select('_id')
            const hasAccess = client && req.user?.handledClients?.some(
                handledClient => handledClient.toString() === client._id.toString()
            )
            if (!hasAccess) {
                return res.status(403).json({ message: 'Unauthorized client access' })
            }
        }

        next()
    } catch (error) {
        next(error)
    }
}

export async function sharepointTemplateAccessMiddleware(req, res, next) {
    const templateId = req.body?.templateId
    if (templateId === undefined || req.user?.role === 'Admin') {
        return next()
    }
    if (typeof templateId !== 'string' || !templateId) {
        return res.status(400).json({ message: 'Invalid SharePoint template ID' })
    }

    try {
        const siteId = process.env.SHAREPOINT_SITE_ID
        if (!siteId) {
            throw new Error('SHAREPOINT_SITE_ID environment variable is required')
        }

        const itemPath = await getSharePointItemPath(siteId, templateId)
        const pathMatch = typeof itemPath === 'string'
            ? itemPath.match(/\/root:\/Templates\/([^/]+)(?:\/|$)/i)
            : null
        const requestedCode = req.params.code?.toUpperCase()
        const templateCode = pathMatch ? decodeURIComponent(pathMatch[1]).toUpperCase() : null
        if (!requestedCode || templateCode !== requestedCode) {
            return res.status(403).json({ message: 'Template does not belong to the requested client' })
        }

        next()
    } catch (error) {
        next(error)
    }
}
