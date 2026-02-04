import axios from 'axios'
import { getGraphToken } from '#config/graphAuth.js'

export async function graphRequest(method, url, data = null, config = {}) {
    const token = await getGraphToken()
    
    const finalUrl = url.startsWith('https://')
        ? url
        : `https://graph.microsoft.com/v1.0${url}`

    return axios({
        method,
        url: finalUrl,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        data,
        ...config
    })
}

export async function listTemplates(_req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const response = await graphRequest(
            "GET",
            `/sites/${SITE_ID}/drive/root:/Templates:/children`
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
    const { templateId } = req.body;
    const SITE_ID = process.env.SHAREPOINT_SITE_ID;

    // 1️⃣ Resolve destination folder
    const folder = await graphRequest(
      'GET',
      `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts`
    );

    const fileName = `Billing-Letter-${Date.now()}.docx`;

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

    // 3️⃣ Give SharePoint time
    await new Promise(r => setTimeout(r, 1500));

    // 4️⃣ Find copied file
    const children = await graphRequest(
      'GET',
      `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts:/children`
    );

    const doc = children.data.value.find(f => f.name === fileName);

    if (!doc) throw new Error('Copied document not found');

    // 5️⃣ Done
    res.json({
      documentId: doc.id,
      editUrl: doc.webUrl
    });

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