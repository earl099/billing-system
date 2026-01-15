import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import puppeteer from 'puppeteer'
import { PDFDocument } from 'pdf-lib'

const execAsync = promisify(exec)

export async function docxToPdf(inputPath) {
    const outputDir = path.dirname(inputPath)

    await execAsync(
        `soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`
    )

    return inputPath.replace(/\.docx$/i, '.pdf')
}

export async function mergePdfs(pdfPaths, outputPath) {
    const mergedPdf = await PDFDocument.create()
    
    for(const p of pdfPaths) {
        const pdf = await PDFDocument.load(fs.readFile(p))
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
    }

    await fs.writeFile(outputPath, await mergedPdf.save())
}