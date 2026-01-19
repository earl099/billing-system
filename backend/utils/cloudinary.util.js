import cloudinary from "#config/cloudinary.js";
import path from 'path'
import fs from 'fs'

function safeName(originalName = 'document.pdf') {
    return path
        .parse(originalName)
        .name.replace(/[^a-z0-9_-]/gi, '_')
        .toLowerCase()
}

export async function uploadPreviewPdf(filePath, originalName) {
    const res = await cloudinary.uploader.upload(filePath, {
        resource_type: 'raw',
        folder: 'billing/previews',
        public_id: `${safeName(originalName)}-${Date.now()}`,
        format: 'pdf',
        unique_filename: false
    })

    fs.existsSync(filePath) && fs.unlinkSync(filePath)
    return res
}

export async function uploadFinalPdf(filePath, name) {
    const filepath = filePath.split('/')
    const res = await cloudinary.uploader.upload(filePath, {
        resource_type: 'raw',
        folder: `billing/${filepath[1]}/final`,
        public_id: `${safeName(name)}-${Date.now()}`,
        format: 'pdf',
        unique_filename: false
    })

    fs.existsSync(filePath) && fs.unlinkSync(filePath)
    return res
}

export async function deletePreviews(publicIds = []) {
    if(!publicIds.length) return

    await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'raw'
    })
}