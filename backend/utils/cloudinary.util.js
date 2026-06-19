/**
 * @fileoverview Cloudinary utility functions
 * Provides helper functions for PDF upload, resource deletion, and cleanup operations
 */

import cloudinary from "#config/cloudinary.js";
import path from 'path'

/**
 * Uploads a PDF buffer to Cloudinary as a raw file
 * Generates a unique public ID using sanitized filename and timestamp
 * 
 * @param {Buffer} buffer - PDF file buffer to upload
 * @param {string} folder - Cloudinary folder path for storage
 * @param {string} originalName - Original filename (used for public ID generation)
 * @returns {Promise<Object>} Cloudinary upload result containing secure_url and public_id
 * 
 * @example
 * const result = await uploadPdfBuffer(pdfBuffer, 'billing/client1', 'invoice.pdf')
 * console.log(result.secure_url) // https://res.cloudinary.com/...
 */
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

/**
 * Deletes multiple resources from Cloudinary by their public IDs
 * Uses 'raw' resource type for PDF files
 * 
 * @param {string[]} publicIds - Array of Cloudinary public IDs to delete
 * @returns {Promise<void>} Resolves when deletion completes (no-op if array is empty)
 */
export async function deleteResources(publicIds = []) {
    if(!publicIds.length) return

    await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'raw'
    })
}

/**
 * Cleans up old preview PDFs from Cloudinary for a specific client
 * Deletes files older than 1 hour from the billing/{client}/previews folder
 * 
 * @param {string} client - Client identifier for folder path
 * @returns {Promise<void>} Resolves when cleanup completes
 */
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
