import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import axios from 'axios'
import { getGraphToken } from '#config/graphAuth.js'

export async function graphRequest(method, url, data = null, config = {}) {
    const token = await getGraphToken()
    
    if(!token) {
        throw new Error('Microsoft Graph is missing')
    }

    let graphPath = url
    
    if(!graphPath.startsWith('/')) {
        graphPath = '/' + graphPath
    }

    const finalUrl = url.startsWith('https://')
        ? graphPath
        : `https://graph.microsoft.com/v1.0${url}`
    
    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(config.headers || {})
    }

    return axios({
        method,
        url: finalUrl,
        data,
        ...config,
        headers
    })
}

export async function listTemplates(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { code } = req.params

        const response = await graphRequest(
            "GET",
            `/sites/${SITE_ID}/drive/root:/Templates/${code}:/children`
        )

        const templates = response.data.value.map(file => ({
            id: file.id,
            name: file.name
        }))

        res.json(templates)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Failed to load templates', err })
    }
}

export async function createBillingLetter(req, res) {
  try {
    const { code } = req.params
    const { templateId, data, isBlank } = req.body;
    const SITE_ID = process.env.SHAREPOINT_SITE_ID;

    const currentDate = new Date()
    const fileName = `Billing-Letter-${code.toUpperCase()}` + 
                     `-${currentDate.getMonth() + 1}-${currentDate.getDate()}-${currentDate.getFullYear()}` + 
                     ` ${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}.docx`;

    // 1️⃣ Resolve destination folder
    const folder = await graphRequest(
      'GET',
      `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}`
    );

    // 2️⃣ Start copy
    await graphRequest(
      'POST',
      `/sites/${SITE_ID}/drive/items/${templateId}/copy`,
      {
        name: fileName,
        parentReference: { id: folder.data.id }
      },
      { validateStatus: s => s === 202 }
    );

    await new Promise(r => setTimeout(r, 1500));

    // 3️⃣ Find copied File
    const children = await graphRequest(
      'GET',
      `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}:/children`
    );

    const doc = children.data.value.find(f => f.name === fileName);

    if (!doc) throw new Error('Copied document not found');

    // 4️⃣ if Blank -> Done
    if(isBlank) {
        return res.json({
            documentId: doc.id,
            editUrl: doc.webUrl
        });
    }

    // 5️⃣ Download File
    const fileRes = await graphRequest(
      'GET',
      `/sites/${SITE_ID}/drive/items/${doc.id}/content`,
      null,
      { responseType: 'arraybuffer' }
    )

    const zip = new PizZip(fileRes.data)

    const docx = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    // 6. Replace Placeholders
    docx.render(data)

    const buffer = docx.getZip().generate({
        type: 'nodebuffer'
    })

    // 7. Upload Modified File
    await graphRequest(
        'PUT',
        `/sites/${SITE_ID}/drive/items/${doc.id}/content`,
        buffer,
        {
            headers: {
                'Content-Type': 
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
        }
    )

    // 8. Done
    res.json({
        documentId: doc.id,
        editUrl: doc.webUrl
    })

  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ message: 'Failed to create document' });
  }
}



export async function exportToPdf(req, res) {
    const { id } = req.body

    try {
        const pdf = await graphRequest(
            "GET",
            `/me/drive/items/${id}/content?format=pdf`
        )

        res.setHeader("Content-Type", "application/pdf")
        res.send(pdf.data)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Failed to export PDF', err })
    }
}