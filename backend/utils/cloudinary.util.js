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

export async function uploadPdfBuffer(buffer, folder, publicId) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder,
                public_id: publicId,
                use_filename: true,
                unique_filename: false,
                format: 'pdf'
            },
            (error, result) => {
                if(error) reject(error)
                else resolve(result)
            }
        ).end(buffer)
    })
}

export async function deleteResources(publicIds = []) {
    if(!publicIds.length) return

    await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'raw'
    })
}