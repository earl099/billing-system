import fs from 'fs'
import mammoth from 'mammoth'
import puppeteer from 'puppeteer'
import { PDFDocument } from 'pdf-lib'

export async function docxToPdf(docxPath, outputPath) {
    const { value } = await mammoth.convertToHtml({ path: docxPath })

    const browser = await puppeteer.launch({ headless: 'new' })
    const page = await browser.newPage()
    await page.setContent(value)
    await page.pdf({ path: outputPath, format: 'A4' })
    await browser.close()
}

export async function mergePdfs(pdfPaths, outputPath) {
    const mergedPdf = await PDFDocument.create()
    
    for(const p of pdfPaths) {
        const pdf = await PDFDocument.load(fs.readFileSync(p))
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
    }

    fs.writeFileSync(outputPath, await mergedPdf.save())
}