import cloudinary from "#config/cloudinary.js";
import path from 'path'

export async function uploadPdfBuffer(buffer, folder, originalName) {
  const base = path.parse(originalName).name
    .replace(/[^\w\d-_]+/g, '_'); // sanitize

  const publicId = `${base}-${Date.now()}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',         // ← important for PDFs
        folder,
        public_id: publicId,
        format: 'pdf'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
}



export async function deleteResources(publicIds = []) {
    if(!publicIds.length) return

    await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'raw'
    })
}

export async function cleanupOldPreviews(client) {
    const { resources } = await cloudinary.search.expression(`folder:billing/${client}/previews AND resource_type:raw`)
    .max_results(100)
    .execute()

    const cutoff = Date.now() - 60 * 60 * 1000

    const stale = resources
        .filter(r => new Date(r.created_at).getTime() < cutoff)
        .map(r => r.public_id);
    
    if(stale.length) {
        await cloudinary.api.delete_resources(stale, { resource_type: 'raw' })
    }
}