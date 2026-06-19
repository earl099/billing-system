/**
 * @fileoverview PDF conversion service using LibreOffice
 * Provides DOCX-to-PDF conversion via the libreoffice-convert library
 */

import fs from 'fs'
import libre from 'libreoffice-convert'

libre.convertAsync = require('util').promisify(libre.convert)

/**
 * Converts a DOCX file to PDF using LibreOffice
 * Reads the DOCX from disk, converts it, and writes the PDF to the output path
 * 
 * @param {string} inputPath - Absolute path to the source DOCX file
 * @param {string} outputPath - Absolute path to write the resulting PDF file
 * @returns {Promise<void>}
 * 
 * @example
 * await convertDocxToPdf('/tmp/document.docx', '/tmp/document.pdf')
 */
export async function convertDocxToPdf(inputPath, outputPath) {
    const docx = fs.readFileSync(inputPath)
    const pdf = await libre.convertAsync(docx, '.pdf', undefined)
    fs.writeFileSync(outputPath, pdf)
}
