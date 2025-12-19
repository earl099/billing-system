import fs from 'fs'
import libre from 'libreoffice-convert'

libre.convertAsync = require('util').promisify(libre.convert)

export async function convertDocxToPdf(inputPath, outputPath) {
    const docx = fs.readFileSync(inputPath)
    const pdf = await libre.convertAsync(docx, '.pdf', undefined)
    fs.writeFileSync(outputPath, pdf)
}