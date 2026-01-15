import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import fetch from 'node-fetch'

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
        let pdfBytes

        if(typeof p === 'string' && p.startsWith('https://')) {
            const res = await fetch(source)
            pdfBytes = await res.arrayBuffer()
        }
        else if(typeof p === 'string') {
            pdfBytes = await fs.readFile(p)
        }
        else {
            throw new Error(`Invalid PDF source: ${p}`)
        }

        const pdf = await PDFDocument.load(pdfBytes)
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
    }

    const mergedBytes = await mergedPdf.save()
    await fs.writeFile(outputPath, mergedBytes)

    return outputPath
}