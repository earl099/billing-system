/**
 * @fileoverview PDF processing utility functions
 * Provides DOCX-to-PDF conversion using LibreOffice and PDF merging capabilities
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import fetch from 'node-fetch'

import { PDFDocument } from 'pdf-lib'

const execFileAsync = promisify(execFile)

/**
 * Converts a DOCX file to PDF using LibreOffice headless mode
 * Automatically cleans up temporary files after conversion
 * 
 * @param {string} docxPath - Absolute path to the DOCX file
 * @returns {Promise<Buffer>} PDF file buffer
 * @throws {Error} If LibreOffice conversion fails or files cannot be read/deleted
 * 
 * @example
 * const pdfBuffer = await docxToPdfBuffer('/tmp/document.docx')
 */
export async function docxToPdfBuffer(docxPath) {
    const outputDir = path.dirname(docxPath)

    await execFileAsync('soffice', [
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', outputDir,
        docxPath
    ])

    const pdfPath = docxPath.replace(/\.docx$/i, '.pdf')
    const buffer = await fs.readFile(pdfPath)

    // cleanup local temp files
    await fs.unlink(docxPath);
    await fs.unlink(pdfPath);

    return buffer;
}

/**
 * Merges multiple PDF sources into a single PDF buffer
 * Accepts Buffer objects or HTTPS URLs as input sources
 * 
 * @param {Array<Buffer|string>} sources - Array of PDF sources (buffers or HTTPS URLs)
 * @returns {Promise<Buffer>} Merged PDF buffer containing all pages in order
 * @throws {Error} If a source is invalid or PDF loading fails
 * 
 * @example
 * const merged = await mergePdfBuffers([pdfBuffer1, 'https://example.com/doc.pdf', pdfBuffer2])
 */
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
