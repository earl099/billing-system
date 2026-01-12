import cloudinary from "#config/cloudinary.js";
import fs from 'fs'

export async function uploadPdf(filePath) {
    const res = await cloudinary.uploader.upload(filePath, {
        resource_type: 'raw',
        folder: 'billing',
        format: 'pdf'
    })

    fs.unlinkSync(filePath)

    return {
        url: res.secure_url,
        public_id: res.public_id
    }
}