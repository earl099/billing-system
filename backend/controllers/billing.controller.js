/**
 * @fileoverview Billing controller
 * Handles billing letter generation, preview, PDF merging, download, and CRUD operations
 */

import fs from 'fs/promises'
import path from 'path'
import billingModel from '#models/billing.model.js'
import { docxToPdfBuffer, mergePdfBuffers,  } from '#utils/pdf.util.js'
import { deleteResources, uploadPdfBuffer } from '#utils/cloudinary.util.js'
import { promisify } from 'util'
import { exec } from 'child_process'
import cloudinary from '#config/cloudinary.js'

const execAsync = promisify(exec)

/**
 * Ensures a file is converted to PDF buffer
 * If file is already PDF, reads and returns it. If DOCX, converts via LibreOffice.
 * Cleans up temporary files after conversion.
 * 
 * @param {Object} file - Multer file object with path, mimetype, originalname
 * @returns {Promise<Buffer>} PDF file buffer
 */
async function ensurePdfBuffer(file) {
    if(file.mimetype === 'application/pdf') {
        const buffer = await fs.readFile(file.path)
        await fs.unlink(file.path)
        return buffer
    }

    const outputDir = path.dirname(file.path)

    await execAsync(
        `soffice --headless --convert-to pdf --outdir "${outputDir}" "${file.path}"`
    )

    const pdfPath = file.path.replace(/\.[^/.]+$/, '.pdf')

    const buffer = await fs.readFile(pdfPath)

    await fs.unlink(file.path)
    await fs.unlink(pdfPath)

    return buffer
}

/**
 * Generates preview PDFs for billing letter and attachments
 * Converts uploaded files to PDF and uploads them to Cloudinary for preview.
 * Returns preview URLs and public IDs for later use in final generation.
 * 
 * @param {import('express').Request} req - Request with files: { billingLetter, attachments[] }
 * @param {import('express').Response} res - Response with { previews[] }
 */
export async function previewBilling(req, res) {
  try {
    const { code } = req.params
    const previews = [];

    const billingLetter = req.files.billingLetter?.[0];
    const attachments = req.files.attachments || [];

    if (!billingLetter) {
      return res.status(400).json({ error: 'Billing letter is required' });
    }

    // --- Billing Letter ---
    const billingBuffer = await ensurePdfBuffer(billingLetter);
    const billingUpload = await uploadPdfBuffer(
      billingBuffer,
      `billing/${code}/previews`,
      billingLetter.originalname
    );

    previews.push({
      public_id: billingUpload.public_id,
      url: billingUpload.secure_url,
      label: 'Billing Letter'
    });

    // --- Attachments ---
    for (const file of attachments) {
      const pdfBuffer = await ensurePdfBuffer(file);

      const upload = await uploadPdfBuffer(
        pdfBuffer,
        `billing/${code}/previews`,
        file.originalname
      );

      previews.push({
        public_id: upload.public_id,
        url: upload.secure_url,
        label: file.originalname
      });
    }

    return res.json({ previews });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Preview generation failed', error });
  }
}

/**
 * Generates final billing PDF by merging all sources
 * Combines billing letter, attachments, and/or preview URLs into a single PDF.
 * Uploads final PDF to Cloudinary and creates a billing record in the database.
 * Cleans up preview files after successful generation.
 * 
 * @param {import('express').Request} req - Request with params: { code }, body: { previewPublicIds, previewUrls }, files: { billingLetter, attachments }
 * @param {import('express').Response} res - Response with { success, billingId, downloadUrl }
 */
export async function generateBilling(req, res) {
  try {
    const { code } = req.params
    
    // SECURITY: Use verified user from JWT token, not from request body
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' })
    }
    
    let previewPublicIds = req.body.previewPublicIds || [];
    let previewUrls = req.body.previewUrls || [];

    // Parse JSON strings if sent as form data
    if (typeof previewPublicIds === 'string') {
      try {
        previewPublicIds = JSON.parse(previewPublicIds);
      } catch {
        return res.status(400).json({ error: 'Invalid previewPublicIds format' });
      }
    }

    if (typeof previewUrls === 'string') {
      try {
        previewUrls = JSON.parse(previewUrls);
      } catch {
        return res.status(400).json({ error: 'Invalid previewUrls format' });
      }
    }

    const billingLetter = req.files?.billingLetter?.[0];
    const attachments = req.files?.attachments || [];

    if (!billingLetter) {
      return res.status(400).json({ error: 'Billing letter is required' });
    }

    const sources = [];

    // Use preview URLs if available, otherwise process uploaded files
    const hasPreviews = Array.isArray(previewUrls) && previewUrls.length;
    if (hasPreviews) {
      previewUrls = previewUrls.filter(
        u => typeof u === 'string' && u.startsWith('https://')
      );

      if (!previewUrls.length) {
        throw new Error('No valid preview URLs provided');
      }

      for (const url of previewUrls) {
        const resPdf = await fetch(url);

        if (!resPdf.ok) {
          throw new Error(`Cloudinary blocked preview fetch (${resPdf.status}): ${url}`);
        }

        const buffer = Buffer.from(await resPdf.arrayBuffer());
        sources.push(buffer);
      }
    }

    else {
      // Process billing letter
      if (billingLetter.mimetype.includes('word')) {
        const buffer = await docxToPdfBuffer(billingLetter.path);
        sources.push(buffer);
      } else {
        const buffer = await fs.readFile(billingLetter.path);
        await fs.unlink(billingLetter.path);
        sources.push(buffer);
      }

      // Process attachments
      for (const file of attachments) {
        if (file.mimetype.includes('word')) {
          const buffer = await docxToPdfBuffer(file.path);
          sources.push(buffer);
        } else {
          const buffer = await fs.readFile(file.path);
          await fs.unlink(file.path);
          sources.push(buffer);
        }
      }
    }

    if (!sources.length) {
      throw new Error('No PDF sources provided');
    }

    // Merge all PDFs into one
    const finalBuffer = await mergePdfBuffers(sources);
    const curDate = new Date()
    const publicId = `billing-${code.toUpperCase()}-${curDate.getMonth() + 1}-${curDate.getDate()}-${curDate.getFullYear()}`;
    const upload = await uploadPdfBuffer(finalBuffer, `billing/${code}/final`, publicId);

    // Create billing record in database
    const record = await billingModel.create({
      client: code.toUpperCase(),
      billingLetter: billingLetter.originalname,
      attachments: attachments.map(a => a.originalname),
      finalPdf: {
        secure_url: upload.secure_url,
        public_id: upload.public_id
      },
      createdBy: userId  // Use verified userId from JWT
    });

    // Clean up preview files
    if (Array.isArray(previewPublicIds) && previewPublicIds.length) {
      await deleteResources(previewPublicIds);
    }

    return res.json({
      success: true,
      billingId: record._id,
      downloadUrl: upload.secure_url
    });

  } catch (error) {
    console.log('Generate error:', error);
    res.status(500).json({
      message: 'Billing generation failed',
      error: error.message || error
    });
  }
}

/**
 * Deletes preview PDF files from Cloudinary
 * Used to clean up temporary preview files when user cancels billing generation
 * 
 * @param {import('express').Request} req - Request with params: { code }, body: { previewPublicIds[] }
 * @param {import('express').Response} res - Response with { success, deleted }
 */
export async function deletePreviews(req, res) {
    try {
      const { code } = req.params
      const { previewPublicIds = [] } = req.body;

      if (!Array.isArray(previewPublicIds) || !previewPublicIds.length) {
          return res.json({ success: true, deleted: 0 });
      }

      const result = await cloudinary.api.delete_resources(previewPublicIds, {
          resource_type: 'raw'
      });

      return res.json({
          success: true,
          deleted: Object.keys(result.deleted || {}).length
      });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Failed to delete previews', error });
    }
}

/**
 * Downloads a billing PDF from Cloudinary
 * Fetches the PDF from Cloudinary and streams it to the client as an attachment
 * 
 * @param {import('express').Request} req - Request with params: { publicId }
 * @param {import('express').Response} res - Response with PDF file stream
 */
export async function downloadBilling(req, res) {
    try {
        const { publicId } = req.params;

        const resource = await cloudinary.api.resource(publicId, {
            resource_type: 'raw'
        });

        const fileUrl = resource.secure_url;

        const response = await fetch(fileUrl);
        const buffer = await response.arrayBuffer();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${resource.public_id.split('/').pop()}.pdf"`
        );

        res.send(Buffer.from(buffer));
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Download failed', error });
    }
}

/**
 * Lists all billing records with pagination
 * Returns paginated list of billing records sorted by creation date (newest first)
 * 
 * @param {import('express').Request} req - Request with query: { page, limit }
 * @param {import('express').Response} res - Response with { list[], pagination }
 */
export async function billingList(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query
        const pageNum = Math.max(1, parseInt(page) || 1)
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10))
        const skip = (pageNum - 1) * limitNum

        const list = await billingModel
            .find()
            .populate('createdBy')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)

        const total = await billingModel.countDocuments()
        const pages = Math.ceil(total / limitNum)

        res.json({ 
            list, 
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages,
                hasNext: pageNum < pages,
                hasPrev: pageNum > 1
            }
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Gets a single billing record by ID
 * 
 * @param {import('express').Request} req - Request with params: { code, _id }
 * @param {import('express').Response} res - Response with { billing }
 */
export async function getBilling(req, res) {
    try {
      const { code } = req.params
      const billing = await billingModel.findById(req.params._id).populate('createdBy')

      if(!billing) return res.status(404).json({ message: `${code.toUpperCase()} Billing not found` })

      res.json({ billing })
    } catch (error) {
      res.status(500).json({ message: 'Server error' })
    }
}

/**
 * Deletes a billing record by ID
 * 
 * @param {import('express').Request} req - Request with params: { code, _id }
 * @param {import('express').Response} res - Response with success message
 */
export async function deleteBilling(req, res) {
  try {
    const { code } = req.params
    const billing = await billingModel.findByIdAndDelete(req.params._id)
    if(!billing) return res.status(404).json({ message: `${code.toUpperCase()} Billing not found` });
    res.json({ message: `${code.toUpperCase()} Billing deleted successfully` })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Deletes all billing records from the database
 * WARNING: Destructive operation - clears all billing data
 * 
 * @param {import('express').Request} req - Express request (unused)
 * @param {import('express').Response} res - Response with deletion result
 */
export async function clearBilling(req, res) {
  try {
    const billing = await billingModel.deleteMany({})

    res.json({ billing })
  } catch (error) {
    res.json({ error })
  }
}
