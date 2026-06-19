/**
 * @fileoverview Billing letter generation service
 * Creates DOCX billing letter documents using the docx library
 */

import { Document, Packer, Paragraph, TextRun } from 'docx'
import fs from 'fs'

/**
 * Generates a billing letter DOCX document and writes it to disk
 * Creates a formatted document with client name, billing period, amount due, and remarks
 * 
 * @param {Object} data - Billing letter data
 * @param {string} data.clientName - Name of the client
 * @param {string} data.billingPeriod - Billing period description
 * @param {number|string} data.amount - Amount due in PHP
 * @param {string} [data.remarks] - Optional remarks or notes
 * @param {string} outputPath - Absolute file path to write the generated DOCX
 * @returns {Promise<void>}
 * 
 * @example
 * await generateBillingLetter({
 *   clientName: 'ABC Corp',
 *   billingPeriod: 'January 2026',
 *   amount: 50000,
 *   remarks: 'Payment due within 30 days'
 * }, '/tmp/billing-letter.docx')
 */
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
