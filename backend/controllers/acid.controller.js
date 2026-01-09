import 'module-alias/register.js'
import acidBillingModel from '#models/acid.model.js'
import { docxToPdf, mergePdfs } from '#utils/pdf.util.js'

export async function previewBilling(req, res) {
    const billingLetter = req.files.billingLetter[0]
    const attachments = req.files.attachments || []

    const previewFiles = []

    async function toPdf(file) {
        if(file.mimetype.includes('word')) {
            const pdfPath = `${file.path}.pdf`
            await docxToPdf(file.path, pdfPath)
            return pdfPath
        }
        return file.path
    }
}

export async function generateAcidBilling(req, res) {
    try {
        const billingLetter = req.files.billingLetter[0]
        const attachments = req.files.attachments || []

        const tempPdfs = []

        let billingPdf = billingLetter.path
        if(billingLetter.mimetype.includes('word')) {
            billingPdf = `${billingLetter.path}.pdf`
            await docxToPdf(billingLetter.path, billingPdf)
        }

        for(const f of attachments) {
            if(f.mimetype.includes('word')) {
                const pdfPath = `${f.path}.pdf`
                await docxToPdf(f.path, pdfPath)
                tempPdfs.push(pdfPath)
            }
            else {
                tempPdfs.push(f.path)
            }
        }

        const finalPdf = `uploads/final-${Date.now()}.pdf`
        await mergePdfs(tempPdfs, finalPdf)

        const record = await acidBillingModel.create({
            billingLetter: billingLetter.filename,
            attachments: attachments.map(a => a.filename),
            finalPdf,
            createdBy: req.user.id
        })

        res.json({ record, downloadUrl: `/${finalPdf}` })
    } catch (error) {
        res.json({ error })
    }
}