/**
 * @fileoverview PDF conversion service using LibreOffice
 * Provides DOCX-to-PDF conversion via the libreoffice-convert library
 */

import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { execFile } from 'child_process'

const execFileAsync = promisify(execFile)

/**
 * Converts a DOCX file to PDF using LibreOffice headless mode
 * Writes the PDF to the same directory as the input file
 * 
 * @param {string} inputPath - Absolute path to the source DOCX file
 * @param {string} outputPath - Absolute path to write the resulting PDF file
 * @returns {Promise<void>}
 */
export async function convertDocxToPdf(inputPath, outputPath) {
    const outputDir = path.dirname(inputPath)
    await execFileAsync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, inputPath])
    const pdfPath = inputPath.replace(/\.docx$/i, '.pdf')
    const pdf = fs.readFileSync(pdfPath)
    fs.writeFileSync(outputPath, pdf)
    fs.unlinkSync(pdfPath)
}
