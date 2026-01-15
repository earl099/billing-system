import path from 'path'
import fs from 'fs/promises'

import acidBillingModel from '#models/acid.model.js'
import { docxToPdf, mergePdfs } from '#utils/pdf.util.js'
import { deletePreviews, uploadPreviewPdf, uploadFinalPdf } from '#utils/cloudinary.util.js'

async function ensurePdf(file) {
    if(file.mimetype === 'application/pdf') {
        return file.path
    }

    const pdfPath = await docxToPdf(file.path)

    file._generatedPdf = pdfPath
    await fs.unlink(file.path)
    return pdfPath
}

export async function previewBilling(req, res) {
    try {
        const billingLetter = req.files.billingLetter[0];
        const attachments = req.files.attachments || [];

        const previewFiles = []

        const billingPdf = await ensurePdf(billingLetter)
        const uploadedBilling = await uploadPreviewPdf(billingPdf, billingLetter.originalname)

        previewFiles.push(uploadedBilling)

        for(const file of attachments) {
            const pdf = await ensurePdf(file)

            const uploaded = await uploadPreviewPdf(pdf, file.originalname)
            previewFiles.push(uploaded)
        }

        res.json({ previewFiles })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Preview generation failed', error })
    }
}

export async function generateAcidBilling(req, res) {
    try {
        const  previewIds = (JSON.parse(req.body.previewPublicIds || '[]'))

        const files = [];
        
        const billingLetter = req.files.billingLetter[0];
        files.push(await ensurePdf(billingLetter))

        for(const file of req.files.attachments || []) {
            const pdf = await ensurePdf(file)
            files.push(pdf)
        }

        const finalPath = `uploads/billing-final-${Date.now()}.pdf`
        
        await mergePdfs(files, finalPath)

        const billingName = `billing-final-${Date.now()}.pdf`
        const uploadedFinal = await uploadFinalPdf(finalPath, billingName)
        
        await deleteFiles(previewPublicIds)

        const record = await acidBillingModel.create({ finalPdf:uploadedFinal, createdBy: req.user.id })

        await deletePreviews(previewIds)

        res.json({
            downloadUrl: uploadedFinal.secure_url,
            record
         })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Billing generation failed', error })
    }
}

export async function cleanupPreviews(req, res) {
    const { previewPublicIds } = req.body
    await deletePreviews(previewPublicIds || [])
    res.status(200)
}