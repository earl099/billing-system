import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import fetch from 'node-fetch'

import { PDFDocument } from 'pdf-lib'

const execAsync = promisify(exec)

export async function docxToPdfBuffer(docxPath) {
    const outputDir = path.dirname(docxPath)

    await execAsync(
        `soffice --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`
    )

    const pdfPath = docxPath.replace(/\.docx$/i, '.pdf')
    const buffer = await fs.readFile(pdfPath)

    // cleanup local temp files
    await fs.unlink(docxPath);
    await fs.unlink(pdfPath);

    return buffer;
}

export async function mergePdfBuffers(sources) {
  const merged = await PDFDocument.create();

  for (const src of sources) {
    let bytes;

    if (Buffer.isBuffer(src)) {
      bytes = src;
    }
    else if (typeof src === 'string' && src.startsWith('https://')) {
      const res = await fetch(src);
      bytes = Buffer.from(await res.arrayBuffer());
    }
    else {
      console.error('Invalid PDF source:', src);
      throw new Error(`Invalid PDF source: ${JSON.stringify(src)}`);
    }

    const pdf = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }

  return Buffer.from(await merged.save());
}