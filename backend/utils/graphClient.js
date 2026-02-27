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

export async function graphBatchRequest(requests, sessionId) {
    const token = await getGraphToken()

    const res = await axios.post(
        'https://graph.microsoft.com/v1.0/$batch',
        { requests },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'workbook-session-id': sessionId
            }
        }
    )

    const failed = res.data.responses.filter(r => r.status >= 400)

    if(failed.length > 0) {
        console.error('Batch failures: ', failed)
        throw new Error('Some batch operations failed')
    }

    return res.data
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
            name: file.name,
            type: file.name.endsWith('.xlsx') ? 'excel' : 'word'
        }))

        res.json(templates)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Failed to load templates', err })
    }
}

export async function createWordBillingLetter(req, res) {
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

    await new Promise(r => setTimeout(r, 5000));

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

export async function createExcelBillingLetter(req, res) {
    try {
        const { code } = req.params
        const { templateId, data, isBlank } = req.body
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const now = new Date()
        const fileName =
            `Billing-Letter-${code.toUpperCase()}-` +
            `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}-` +
            `${now.getHours()}${now.getMinutes()}${now.getSeconds()}.xlsx`

        // 1️⃣ Resolve destination folder
        const folder = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}`
        )

        // 2️⃣ Copy template (FIXED ENDPOINT)
        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${templateId}/copy`,
            {
                name: fileName,
                parentReference: { id: folder.data.id }
            },
            { validateStatus: s => s === 202 }
        )

        await new Promise(r => setTimeout(r, 2000))

        // 3️⃣ Get copied file
        const children = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}:/children`
        )

        const excelFile = children.data.value.find(f => f.name === fileName)

        if (!excelFile) throw new Error('Copied Excel file not found')

        if (isBlank) {
            return res.json({
                documentId: excelFile.id,
                editUrl: excelFile.webUrl
            })
        }

        const fileId = excelFile.id

        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        // ===============================
        // BILLING LETTER SHEET
        // ===============================
        const billingSheet = 'BILLING LETTER'

        const billingUpdates = [
            ['I4', `=CONCAT("SOA NO: PMS ", TEXT("${new Date(data.monthAndYear).getMonth()}/${new Date(data.billingYear).getFullYear()}", "yyyy"))`],
            ['I5', `=UPPER(TEXT("${new Date(data.billingMonth).getMonth() + 1}/${new Date(data.monthAndYear).getFullYear()}", "mmmm"))`],
            ['I6', `=UPPER(TEXT("${new Date(data.monthAndYear).getDate()}/${new Date(data.billingDate).getMonth() + 1}/${new Date(data.monthAndYear).getFullYear()}", "mmmm dd, yyyy"))`],
            ['A20', `=CONCAT("Property security and upkeep services rendered by LBRDC as of ", TEXT("${new Date(data.monthAndYear).getMonth() + 1}/${new Date(data.monthAndYear).getFullYear()}", "mmmm yyyy"))`],
            ['A21', `for ${data.clientName}`],
            ['B25', `=UPPER(TEXT("${new Date(data.monthAndYear).getMonth() + 1}/${new Date(data.monthAndYear).getFullYear()}", "mmmm yyyy"))`],
            ['K25', data.amount],
            ['K29', '=SUM(K22:K28)'],
            ['I35', `PMC NO. ${data.pmcNo}`],
            ['B37', `=UPPER(TEXT("${new Date(data.monthAndYear).getMonth() + 1}/${new Date(data.monthAndYear).getFullYear()}", "mmmm yyyy"))`],
            ['A44', data.bAsstName],
            ['E44', data.bcuChiefName]
        ]

        const batchRequests = billingUpdates.map(([cell, value], index) => ({
            id: `billing-${index + 1}`,
            method: 'PATCH',
            url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${billingSheet}')/range(address='${cell}')`,
            headers: { 'Content-Type': 'application/json' },
            body: { values: [[value]] }
        }))

        await graphBatchRequest(batchRequests)

        // ===============================
        // TRANSMITTAL SHEET
        // ===============================
        const transmittalSheet = 'TRANSMITTAL'

        const transmittalBatch = [
            ['B11', `=UPPER(TEXT("${new Date(data.billingDate).getDate()}/${new Date(data.billingDate).getMonth() + 1}/${new Date(data.billingDate).getFullYear()}", "mmmm dd, yyyy"))`],
            ['E11', data.bAsstName],
            ['B30', data.bAsstName]
        ].map(([cell, value], index) => ({
            id: `${index + 1}`,
            method: 'PATCH',
            url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${transmittalSheet}')/range(address='${cell}')`,
            headers: { 'Content-Type': 'application/json' },
            body: { values: [[value]] }
        }))

        await graphBatchRequest(transmittalBatch)

        if (Array.isArray(data.transmittalItems) && data.transmittalItems.length > 0) {
            const rows = data.transmittalItems.map(item => [
                '=ROW()-ROW(TransmittalTable[#Headers])',
                item.property,
                `=UPPER(TEXT("${new Date(item.monthYear).getMonth() + 1}/${new Date(item.monthYear).getFullYear()}", "mmmm yyyy"))`,
                item.amount,
                item.pmcNo,
                '="x"'
            ])

            await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/tables('TransmittalTable')/rows/add`,
                { values: rows }
            )
        }

        // Recalculate formulas
        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
            { calculationType: 'Full' }
        )

        res.json({
            documentId: excelFile.id,
            editUrl: excelFile.webUrl
        })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to create Excel document' })
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