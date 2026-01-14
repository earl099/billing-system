import fs from 'fs'
import mammoth from 'mammoth'
import puppeteer from 'puppeteer'
import { PDFDocument } from 'pdf-lib'

export async function docxToPdf(docxPath, outputPath) {
    try {
        const content = await fs.readFile(docxPath, 'utf-8')
        const browser = await puppeteer.launch({ 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        })

        const page = await browser.newPage()
        await page.setContent(`<pre>${content}</pre>`, { waitUntil: 'networkidle0' })
        await page.pdf({ path: outputPath, format: 'A4' })
    } catch (error) {
        console.log('Could not create browser instance: ', error)
    } finally {
        await browser.close()
    }
    
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