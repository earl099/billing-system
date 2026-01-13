import cloudinary from "#config/cloudinary.js";
import path from 'path'
import fs from 'fs'

export async function uploadPdf(filePath, originalName = 'document.pdf') {
    const base = path.parse(originalName).name
    const safeName = base.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()

    const res = await cloudinary.uploader.upload(filePath, {
        resource_type: 'raw',
        folder: 'billing',
        public_id: safeName + '-' + Date.now(),
        use_filename: true,
        unique_filename: true,
        format: 'pdf'
    })

    fs.unlinkSync(filePath)

    return {
        url: res.secure_url,
        public_id: res.public_id,
        originalName
    }
}

export async function deleteFiles(publicIds = []) {
    if(!publicIds.length) return

    await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'raw'
    })
}