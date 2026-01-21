import fs from 'fs/promises'
import path from 'path'
import acidBillingModel from '#models/acid.model.js'
import { docxToPdfBuffer, mergePdfBuffers,  } from '#utils/pdf.util.js'
import { deleteResources, uploadPdfBuffer } from '#utils/cloudinary.util.js'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

async function ensurePdfBuffer(file) {
    if(file.mimetype === 'application/pdf') {
        const buffer = await fs.readFile(file.path)
        await fs.unlink(file.path)
        return buffer
    }

    const outputDir = path.dirname(file.path)

    await execAsync(
        `soffice --headless --convert-to pdf --outdir "${outputDir}" "${file.path}"`
    )

    const pdfPath = file.path.replace(/\.[^/.]+$/, '.pdf')

    const buffer = await fs.readFile(pdfPath)

    await fs.unlink(file.path)
    await fs.unlink(pdfPath)

    return buffer
}

export async function previewBilling(req, res) {
    try {
        const previews = [];

        const billingLetter = req.files.billingLetter[0]
        const attachments = req.files.attachments || []

        if(!billingLetter) {
            return res.status(400).json({ error: 'Billing letter is required' })
        }

        const billingBuffer = await ensurePdfBuffer(billingLetter)
        const billingUpload = await uploadPdfBuffer(
            billingBuffer,
            'billing/acid/previews',
            `billing-letter-acid-${Date.now()}`
        )

        previews.push({
            public_id: billingUpload.public_id,
            url: billingUpload.secure_url,
            label: 'billingLetter'
        })

        for(const file of attachments) {
            const pdfBuffer = await ensurePdfBuffer(file)
            const upload = await uploadPdfBuffer(
                pdfBuffer,
                'billing/acid/previews',
                pdfBuffer.public_id
            )

            previews.push({
                public_id: upload.public_id,
                url: upload.secure_url,
                label: file.originalname
            })
        }

        return res.json({ previews })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Preview generation failed', error })
    }
}

export async function generateAcidBilling(req, res) {
    try {
        const {
            previewPublicIds = [],
            mode = 'direct'
        } = req.body;

        const billingLetter = req.files?.billingLetter?.[0];
        const attachments = req.files?.attachments || [];

        if (!billingLetter) {
            return res.status(400).json({ error: 'Billing letter is required' });
        }

        const sources = [];

        // ============================
        // 1️⃣ Use preview PDFs (optional)
        // ============================
        if (mode === 'preview' && Array.isArray(previewPublicIds) && previewPublicIds.length) {
        for (const publicId of previewPublicIds) {
            const resource = await cloudinary.api.resource(
                publicId, 
                {
                    resource_type: 'raw'
                }
            );

            if (!resource?.secure_url) {
                throw new Error(`Invalid preview resource: ${publicId}`);
            }

            const buffer = await fetch(resource.secure_url).then(r => r.arrayBuffer());
            sources.push(Buffer.from(buffer));
        }
        }

        // ============================
        // 2️⃣ Or generate PDFs directly
        // ============================
        else {
        if (billingLetter.mimetype.includes('word')) {
            const buffer = await docxToPdfBuffer(billingLetter.path);
            sources.push(buffer);
        } else {
            const buffer = await fs.readFile(billingLetter.path);
            sources.push(buffer);
        }

        for (const file of attachments) {
            if (file.mimetype.includes('word')) {
                const buffer = await docxToPdfBuffer(file.path);
                sources.push(buffer);
            } else {
                const buffer = await fs.readFile(file.path);
                sources.push(buffer);
            }
        }
        }

        // ============================
        // 3️⃣ Merge PDFs
        // ============================
        const finalBuffer = await mergePdfBuffers(sources);

        // ============================
        // 4️⃣ Upload final PDF to Cloudinary (diskless)
        // ============================
        const publicId = `billing-acid-${Date.now()}.pdf`;

        const upload = await uploadPdfBuffer(
            finalBuffer,
            'billing/acid/final',
            publicId
        );

        // ============================
        // 5️⃣ Persist billing record
        // ============================
        const record = await acidBillingModel.create({
        billingLetter: billingLetter.originalname,
        attachments: attachments.map(f => f.originalname),
        finalPdf: {
            secure_url: upload.secure_url,
            public_id: upload.public_id
        },
        createdBy: req.user?._id
        });

        // ============================
        // 6️⃣ Cleanup preview files
        // ============================
        if (Array.isArray(previewPublicIds) && previewPublicIds.length) {
            await deleteResources(previewPublicIds);
        }

        return res.json({
            success: true,
            record,
            final: {
                public_id: upload.public_id,
                url: upload.secure_url
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Billing generation failed',
            error: error.message
        });
    }
}

export async function deletePreviews(req, res) {
    try {
    const { previewPublicIds = [] } = req.body;

    if (!Array.isArray(previewPublicIds) || !previewPublicIds.length) {
        return res.json({ success: true, deleted: 0 });
    }

    const result = await cloudinary.api.delete_resources(previewPublicIds, {
        resource_type: 'raw'
    });

    return res.json({
        success: true,
        deleted: Object.keys(result.deleted || {}).length
    });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Failed to delete previews', error });
    }
}


export async function acidBillingList(_req, res) {
    try {
        const list = await acidBillingModel.find()
        const total = await acidBillingModel.countDocuments()

        res.json({ list, total })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}

export async function getAcidBilling(req, res) {
    try {
        const acidBilling = await acidBillingModel.findById(req.params._id)
        if(!client) return res.status(404).json({ message: 'ACID Billing not found' })

        res.json({ acidBilling })
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error}` })
    }
}