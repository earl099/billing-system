/**
 * @fileoverview File path utility functions
 * Provides helper functions for file path transformations
 */

import path from 'path'

/**
 * Converts a DOCX file path to its corresponding PDF file path
 * Replaces the .docx extension with .pdf while preserving the directory structure
 * 
 * @param {string} originalPath - Path to the original DOCX file
 * @returns {string} Path with .pdf extension
 * 
 * @example
 * makePdfPath('/uploads/document.docx') // returns '/uploads/document.pdf'
 */
export function makePdfPath(originalPath) {
    const dir = path.dirname(originalPath)
    const base = path.basename(originalPath, path.extname(originalPath))
    return path.join(dir, `${base}.pdf`)
}
