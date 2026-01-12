import path from 'path'
import fs from 'fs'

import acidBillingModel from '#models/acid.model.js'
import { docxToPdf, makePdfPath, mergePdfs } from '#utils/pdf.util.js'
import { uploadPdf } from '#utils/cloudinary.util.js'

async function ensurePdf(file) {
    const isPdf = file.originalname.toLowerCase().endsWith('.pdf')
    
    if(isPdf) {
        return file.path
    }

    const pdfPath = makePdfPath(file.path)
    await docxToPdf(file.path, pdfPath)
    return pdfPath
}

export async function previewBilling(req, res) {
    try {
        const billingLetter = req.files.billingLetter[0];
        const attachments = req.files.attachments || [];

        const previewFiles = []

        const billingPdf = await ensurePdf(billingLetter)
        const uploadedBilling = await uploadPdf(billingPdf)

        previewFiles.push({ label: 'Billing Letter', ...uploadedBilling })

        for(const file of attachments) {
            const pdf = await ensurePdf(file)
            const uploaded = await uploadPdf(pdf)
            previewFiles.push({ label: file.originalname, ...uploaded })
        }

        res.json({ previewFiles })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Preview generation failed' })
    }
}

export async function generateAcidBilling(req, res) {
    try {
        const billingLetter = req.files.billingLetter[0];
        const attachments = req.files.attachments || [];

        const files = [];

        const billingPdf = await ensurePdf(billingLetter)
        files.push(billingPdf)

        for(const file of attachments) {
            const pdf = await ensurePdf(file)
            files.push(pdf)
        }

        const finalPath = path.join(
            'uploads',
            `billing-final-${Date.now()}.pdf`
        )

        await mergePdfs(files, finalPath)

        const uploadedFinal = await uploadPdf(finalPath)

        const record = await acidBillingModel.create({ finalPdf:uploadedFinal, createdBy: req.user.id })

        res.json({ success: true, record, downloadUrl: uploadedFinal.url })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Billing generation failed' })
    }
}