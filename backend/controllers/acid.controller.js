import path from 'path'
import fs from 'fs'

import acidBillingModel from '#models/acid.model.js'
import { docxToPdf, mergePdfs } from '#utils/pdf.util.js'
import { makePdfPath } from '#utils/file.util.js'
import { deleteFiles, uploadPdf } from '#utils/cloudinary.util.js'

async function ensurePdf(file) {
    const isPdf = file.originalname.toLowerCase().endsWith('.pdf')
    
    if(isPdf) {
        return file.path
    }

    const pdfPath = makePdfPath(file.path)
    await docxToPdf(file.path, pdfPath)

    file._generatedPdf = pdfPath

    return pdfPath
}

export async function previewBilling(req, res) {
    try {
        const billingLetter = req.files.billingLetter[0];
        const attachments = req.files.attachments || [];

        const previewFiles = []

        const billingPdf = await ensurePdf(billingLetter)
        const uploadedBilling = await uploadPdf(billingPdf, billingLetter.originalname)

        previewFiles.push({ label: 'Billing Letter', ...uploadedBilling })

        for(const file of attachments) {
            const pdf = await ensurePdf(file)
            const uploaded = await uploadPdf(pdf, file.originalname)
            previewFiles.push({ label: file.originalname, ...uploaded })
        }

        res.json({ previewFiles })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Preview generation failed', error })
    }
}

export async function generateAcidBilling(req, res) {
    try {
        const billingLetter = req.files.billingLetter[0];
        const attachments = req.files.attachments || [];
        const  previewPublicIds = (JSON.parse(req.body.previewPublicIds || '[]'))
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

        const billingName = `billing-final-${Date.now()}.pdf`
        const uploadedFinal = await uploadPdf(finalPath, billingName)
        
        await deleteFiles(previewPublicIds)

        const record = await acidBillingModel.create({ finalPdf:uploadedFinal, createdBy: req.user.id })

        res.json({ success: true, record, downloadUrl: uploadedFinal.url })

    
        //CLEANUP FUNCTIONS
        const tempFiles = getAllLocalFiles(req)
        for(const file of tempFiles) {
            fs.existsSync(file) && fs.unlinkSync(file)
        }

        const generated = []

        for(const f of attachments) {
            if(f._generatedPdf) generated.push(f._generatedPdf)
        }

        if(billingLetter._generatedPdf) generated.push(billingLetter._generatedPdf);

        for(const p of generated) {
            fs.existsSync(p), fs.unlinkSync(p)
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Billing generation failed' })
    }
}

function getAllLocalFiles(req) {
    const files = []

    if(req.files?.billingLetter) {
        files.push(req.files.billingLetter[0].path)
    }

    if(req.files?.attachments) {
        for(const f of req.files.attachments) {
            files.push(f.path)
        }
    }

    return files
}