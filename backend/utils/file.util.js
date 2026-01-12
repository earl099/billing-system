import path from 'path'

export function makePdfPath(originalPath) {
    const dir = path.dirname(originalPath)
    const base = path.basename(originalPath, path.extname(originalPath))
    return path.join(dir, `${base}.pdf`)
}