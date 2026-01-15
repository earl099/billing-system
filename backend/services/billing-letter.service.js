import { Document, Packer, Paragraph, TextRun } from 'docx'
import fs from 'fs'

export async function generateBillingLetter(data, outputPath) {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [
                        new TextRun({ text: 'BILLING LETTER', bold: true, size: 32 })
                    ]
                }),
                new Paragraph(`Client: ${data.clientName}`),
                new Paragraph(`Billing Period: ${data.billingPeriod}`),
                new Paragraph(`Amount Due: ₱${data.amount}`),
                new Paragraph({ text: data.remarks || '' })
            ]
        }]
    })

    const buffer = await Packer.toBuffer(doc)
    fs.writeFileSync(outputPath, buffer)
}