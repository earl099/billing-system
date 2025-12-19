import acidBillingModel from "../models/acid.model"
import { generateBillingLetter } from "../services/billing-letter.service"
import { convertDocxToPdf } from "../services/pdf.service"

export async function generate(req, res) {
    try {
        const data = JSON.parse(req.body.data)
        const ref = Date.now()

        const docxPath = `uploads/billing-${ref}.docx`
        const pdfPath = `uploads/billing-${ref}.pdf`

        await generateBillingLetter(data, docxPath)
        await convertDocxToPdf(docxPath, pdfPath)

        const record = await acidBillingModel.create({
            referenceNo: ref,
            ...data,
            billingLetterDocx: docxPath,
            uploadedFiles: req.files.map(f => f.path),
            finalPdf: pdfPath,
            createdBy: req.user.name
        })

        res.json({ record, downloadUrl: pdfPath })
    } catch (error) {
        res.status(500).json({ message: 'Server error: ', error })
    }
}