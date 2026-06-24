/**
 * @fileoverview Microsoft Graph API client for SharePoint document and Excel table operations
 * 
 * Provides two main categories of functionality:
 * 
 * 1. **Billing Letter Generation** - Copies Word/Excel templates from SharePoint,
 *    fills in placeholder data using docxtemplater (Word) or Graph batch API (Excel),
 *    and returns the editable document URL.
 * 
 * 2. **Excel Table CRUD** - Reads, adds, updates, and deletes rows in SharePoint
 *    Excel workbook tables (EmployeeTable for manpower, PositionTable for billing rates).
 *    Uses workbook sessions for consistent updates with formula recalculation.
 * 
 * All functions are Express route handlers except graphRequest, graphBatchRequest, and mapToRow
 * which are internal helpers.
 */

import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import axios from 'axios'
import { getGraphToken } from '#config/graphAuth.js'

/**
 * Sends an authenticated request to the Microsoft Graph API
 * Automatically acquires a bearer token, constructs the full Graph URL,
 * and merges custom headers/config into the axios request.
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {string} url - Graph API path (e.g., '/sites/{id}/drive/...') or full HTTPS URL
 * @param {any} [data=null] - Request body data
 * @param {Object} [config={}] - Additional axios config (headers, responseType, validateStatus, etc.)
 * @returns {Promise<import('axios').AxiosResponse>} Axios response from the Graph API
 * @throws {Error} If no Graph token is available
 */
export async function graphRequest(method, url, data = null, config = {}) {
    const token = await getGraphToken()
    
    if(!token) {
        throw new Error('Microsoft Graph is missing')
    }

    let graphPath = url
    
    if(!graphPath.startsWith('/')) {
        graphPath = '/' + graphPath
    }

    // Use full URL if already absolute, otherwise prepend Graph v1.0 base
    const finalUrl = url.startsWith('https://')
        ? url
        : `https://graph.microsoft.com/v1.0${graphPath}`
    
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

/**
 * Sends a batch of requests to the Microsoft Graph API in a single HTTP call
 * Uses the $batch endpoint for atomic multi-operation execution within a workbook session.
 * Throws if any individual request in the batch returns a 4xx/5xx status.
 * 
 * @param {Array<{ id: string, method: string, url: string, headers?: Object, body?: any }>} requests - Array of batch request objects
 * @param {string} sessionId - Active workbook session ID for consistent operations
 * @returns {Promise<Object>} Batch response data containing individual response results
 * @throws {Error} If any batch operation fails with status >= 400
 */
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
        for (const failure of failed) {
            console.error('Batch failures: ', failure.body.error)
        }
        
        throw new Error('Some batch operations failed')
    }

    return res.data
}

/**
 * Lists available document templates for a client from SharePoint
 * Fetches children of the Templates/{code} folder and classifies each as 'excel' or 'word'
 * 
 * @param {import('express').Request} req - Request with params: { code } (client code)
 * @param {import('express').Response} res - Response with array of { id, name, type }
 */
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
            type: (file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm')) ? 'excel' : 'word'
        }))

        res.json(templates)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Failed to load templates', err })
    }
}

/**
 * Creates a Word billing letter from a SharePoint DOCX template
 * 
 * Workflow:
 * 1. Resolves the destination folder (BillingLetterDrafts/{code})
 * 2. Copies the template to the destination with a timestamped filename
 * 3. If isBlank=true, returns the document URL immediately
 * 4. Otherwise, downloads the copy, fills placeholders using docxtemplater,
 *    re-uploads the modified document, and returns the edit URL
 * 
 * @param {import('express').Request} req - Request with params: { code }, body: { templateId, data, isBlank }
 * @param {import('express').Response} res - Response with { documentId, editUrl }
 */
export async function createWordBillingLetter(req, res) {
  try {
    const { code } = req.params
    const { templateId, data, isBlank } = req.body;
    const SITE_ID = process.env.SHAREPOINT_SITE_ID;

    const currentDate = new Date()
    const fileName = `Billing-Letter-${code.toUpperCase()}` + 
                     `-${currentDate.getMonth() + 1}-${currentDate.getDate()}-${currentDate.getFullYear()}` + 
                     ` ${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}.docx`;

    // 1. Resolve destination folder
    const folder = await graphRequest(
      'GET',
      `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}`
    );

    // 2. Start async copy of template to destination
    await graphRequest(
      'POST',
      `/sites/${SITE_ID}/drive/items/${templateId}/copy`,
      {
        name: fileName,
        parentReference: { id: folder.data.id }
      },
      { validateStatus: s => s === 202 }
    );

    // Wait for SharePoint copy to complete
    await new Promise(r => setTimeout(r, 5000));

    // 3. Find the copied file in the destination folder
    const children = await graphRequest(
      'GET',
      `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}:/children`
    );

    const doc = children.data.value.find(f => f.name === fileName);

    if (!doc) throw new Error('Copied document not found');

    // 4. If blank template requested, return immediately without data filling
    if(isBlank) {
        return res.json({
            documentId: doc.id,
            editUrl: doc.webUrl
        });
    }

    // 5. Download the copied file content
    const fileRes = await graphRequest(
      'GET',
      `/sites/${SITE_ID}/drive/items/${doc.id}/content`,
      null,
      { responseType: 'arraybuffer' }
    )

    // 6. Replace template placeholders using docxtemplater
    const zip = new PizZip(fileRes.data)

    const docx = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    docx.render(data)

    const buffer = docx.getZip().generate({
        type: 'nodebuffer'
    })

    // 7. Upload the modified document back to SharePoint
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

    // 8. Return document ID and edit URL for the client to open
    res.json({
        documentId: doc.id,
        editUrl: doc.webUrl
    })

  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ message: 'Failed to create document' });
  }
}

/**
 * Creates an Excel (SPAD) billing letter from a SharePoint XLSX template
 * 
 * Workflow:
 * 1. Copies the Excel template to BillingLetterDrafts/{code}
 * 2. If isBlank=true, returns the document URL immediately
 * 3. Otherwise, opens a workbook session and uses the Graph batch API to:
 *    - Fill the BILLING LETTER sheet with formatted billing data (dates, amounts, names)
 *    - Fill the TRANSMITTAL sheet with billing assistant info
 *    - Add transmittal item rows to the TransmittalTable if provided
 * 4. Forces full formula recalculation and closes the workbook session
 * 
 * @param {import('express').Request} req - Request with params: { code }, body: { templateId, data, isBlank }
 *   data includes: billingDate, monthAndYear, clientName, amount, pmcNo, bAsstName, bcuChiefName, transmittalItems[]
 * @param {import('express').Response} res - Response with { documentId, editUrl }
 */
export async function createSpadBillingLetter(req, res) {
    try {
        const { code } = req.params
        const { templateId, data, isBlank } = req.body
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const now = new Date()
        const fileName =
            `Billing-Letter-${code.toUpperCase()}-` +
            `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}-` +
            `${now.getHours()}${now.getMinutes()}${now.getSeconds()}.xlsx`

        // 1. Resolve destination folder
        const folder = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}`
        )

        // 2. Copy template to destination
        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${templateId}/copy`,
            {
                name: fileName,
                parentReference: { id: folder.data.id }
            },
            { validateStatus: s => s === 202 }
        )

        // Wait for SharePoint copy to complete
        await new Promise(r => setTimeout(r, 2000))

        // 3. Find the copied Excel file
        const children = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}:/children`
        )

        const excelFile = children.data.value.find(f => f.name === fileName)

        if (!excelFile) throw new Error('Copied Excel file not found')

        // If blank template requested, return immediately
        if (isBlank) {
            return res.json({
                documentId: excelFile.id,
                editUrl: excelFile.webUrl
            })
        }

        const fileId = excelFile.id

        // Open a workbook session for atomic multi-cell updates
        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        // ==========================================
        // BILLING LETTER SHEET - Fill billing data cells
        // ==========================================
        const billingSheet = 'BILLING LETTER'

        const billingDate = new Date(data.billingDate)
        const monthAndYear = new Date(data.monthAndYear)

        // Cell-value pairs for the BILLING LETTER sheet using Excel TEXT formulas for date formatting
        const billingUpdates = [
            ['I4', `=CONCAT("SOA NO: PMS ", TEXT("${monthAndYear.getMonth() + 1}/${monthAndYear.getFullYear()}", "yyyy"))`],
            ['I5', `=UPPER(TEXT("${monthAndYear.getMonth() + 1}/${monthAndYear.getFullYear()}", "mmmm"))`],
            ['I6', `=UPPER(TEXT("${billingDate.getDate()}/${monthAndYear.getMonth() + 1}/${monthAndYear.getFullYear()}", "mmmm dd, yyyy"))`],
            ['A20', `=CONCAT("Property security and upkeep services rendered by LBRDC as of ", TEXT("${monthAndYear.getMonth() + 1}/${monthAndYear.getFullYear()}", "mmmm yyyy"))`],
            ['A21', `for ${data.clientName}`],
            ['B25', `=UPPER(TEXT("${monthAndYear.getMonth() + 1}/${monthAndYear.getFullYear()}", "mmmm yyyy"))`],
            ['K25', data.amount],
            ['K29', '=SUM(K22:K28)'],
            ['I35', `PMC NO. ${data.pmcNo}`],
            ['B37', `=UPPER(TEXT("${monthAndYear.getMonth() + 1}/${monthAndYear.getFullYear()}", "mmmm yyyy"))`],
            ['A44', data.bAsstName],
            ['E44', data.bcuChiefName]
        ]

        // Convert cell updates to Graph batch request format
        const batchRequests = billingUpdates.map(([cell, value], index) => ({
            id: `billing-${index + 1}`,
            method: 'PATCH',
            url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${billingSheet}')/range(address='${cell}')`,
            headers: { 'Content-Type': 'application/json' },
            body: { values: [[value]] }
        }))

        await graphBatchRequest(batchRequests, sessionId)

        // ==========================================
        // TRANSMITTAL SHEET - Fill transmittal header cells
        // ==========================================
        const transmittalSheet = 'TRANSMITTAL'

        const transmittalBatch = [
            ['B11', `=UPPER(TEXT("${billingDate.getDate()}/${billingDate.getMonth() + 1}/${billingDate.getFullYear()}", "mmmm dd, yyyy"))`],
            ['E11', data.bAsstName],
            ['B30', data.bAsstName]
        ].map(([cell, value], index) => ({
            id: `${index + 1}`,
            method: 'PATCH',
            url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${transmittalSheet}')/range(address='${cell}')`,
            headers: { 'Content-Type': 'application/json' },
            body: { values: [[value]] }
        }))

        await graphBatchRequest(transmittalBatch, sessionId)

        // Add transmittal item rows to the TransmittalTable if provided
        if (Array.isArray(data.transmittalItems) && data.transmittalItems.length > 0) {
            const rows = data.transmittalItems.map(item => {
                const itemDate = new Date(item.monthYear)
                return [
                    '=ROW()-ROW(TransmittalTable[#Headers])',  // Auto-incrementing row number
                    item.property,
                    `=UPPER(TEXT("${itemDate.getMonth() + 1}/${itemDate.getFullYear()}", "mmmm yyyy"))`,
                    item.amount,
                    item.pmcNo,
                    '="x"'  // Checkbox formula
                ]
            })

            await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/tables('TransmittalTable')/rows/add`,
                { values: rows }
            )
        }

        // Force full recalculation of all formulas in the workbook
        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
            { calculationType: 'Full' }
        )

        // Close workbook session to persist all changes
        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
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

export async function createOfbankBilling(req, res) {
    try {
        const { code } = req.params
        const { templateId, dateRange } = req.body
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const fileName = `${code.toUpperCase()}-Billing-${dateRange.label}.xlsm`

        const folder = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}`
        )

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${templateId}/copy`,
            {
                name: fileName,
                parentReference: { id: folder.data.id }
            },
            { validateStatus: s => s === 202 }
        )

        await new Promise(r => setTimeout(r, 5000))

        const children = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}:/children`
        )

        const excelFile = children.data.value.find(f => f.name === fileName)

        if (!excelFile) throw new Error('Copied Excel file not found')

        res.json({
            documentId: excelFile.id,
            editUrl: excelFile.webUrl,
            fileName
        })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to create OFBANK billing' })
    }
}

export async function setupOfbankBilling(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params
        const { dateRange } = req.body

        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        const janSheetName = `Janitorial ${dateRange.sheetLabel}`
        const manSheetName = `Manpower ${dateRange.sheetLabel}`

        const renameBatch = [
            {
                id: 'rename-1',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets/{jBillingSheet}`,
                headers: { 'Content-Type': 'application/json' },
                body: { name: janSheetName }
            },
            {
                id: 'rename-2',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets/{oBillingSheet}`,
                headers: { 'Content-Type': 'application/json' },
                body: { name: manSheetName }
            }
        ]

        await graphBatchRequest(renameBatch, sessionId)

        const dateBatch = [
            {
                id: 'date-1',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${janSheetName}')/range(address='A4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['for the period ' + dateRange.label]] }
            },
            {
                id: 'date-2',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${manSheetName}')/range(address='A4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['for the period ' + dateRange.label]] }
            },
            {
                id: 'date-3',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('OFBANK MANPOWER')/range(address='B4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['FOR THE PERIOD OF ' + dateRange.label]] }
            }
        ]

        await graphBatchRequest(dateBatch, sessionId)

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
            { calculationType: 'Full' }
        )

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )

        res.json({ message: 'Billing setup complete' })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to setup OFBANK billing' })
    }
}

export async function getOfbankTables(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params

        const [jRes, oRes] = await Promise.all([
            graphRequest(
                'GET',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/tables('jBillingTable')/rows`
            ),
            graphRequest(
                'GET',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/tables('oBillingTable')/rows`
            )
        ])

        res.json({
            jBilling: jRes.data.value.map(r => ({ index: r.index, values: r.values[0] })),
            oBilling: oRes.data.value.map(r => ({ index: r.index, values: r.values[0] }))
        })
    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to read billing tables' })
    }
}

export async function saveOfbankTables(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params
        const { jBillingRows, oBillingRows } = req.body

        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        const JBILLING_FORMULA_INDICES = [0, 2, 3, 4, 5, 6]
        const OBILLING_FORMULA_INDICES = [0, 2, 3, 4]

        function buildBatchRequests(rows, tableName, formulaIndices) {
            return rows.map(row => {
                const values = row.values.map((val, i) =>
                    formulaIndices.includes(i) ? null : val
                )
                return {
                    id: `${tableName}-${row.index}`,
                    method: 'PATCH',
                    url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/tables('${tableName}')/rows/itemAt(index=${row.index})`,
                    headers: { 'Content-Type': 'application/json' },
                    body: { values: [values] }
                }
            })
        }

        const jBatch = buildBatchRequests(jBillingRows, 'jBillingTable', JBILLING_FORMULA_INDICES)
        const oBatch = buildBatchRequests(oBillingRows, 'oBillingTable', OBILLING_FORMULA_INDICES)

        const allRequests = [...jBatch, ...oBatch]

        for (let i = 0; i < allRequests.length; i += 20) {
            const chunk = allRequests.slice(i, i + 20)
            await graphBatchRequest(chunk, sessionId)
        }

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
            { calculationType: 'Full' }
        )

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )

        res.json({ message: 'Billing data saved successfully' })
    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to save billing data' })
    }
}

// ==========================================
// EXCEL TABLE CRUD FUNCTIONS (Manpower/Rates)
// ==========================================

/**
 * Lists all rows from a SharePoint Excel workbook table
 * Fetches every row with its index and cell values
 * 
 * @param {import('express').Request} req - Request with params: { code }, query: { fileName, tableName }
 * @param {import('express').Response} res - Response with { list: [{ index, values }] }
 */
export async function listData(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { code } = req.params
        const { fileName, tableName } = req.query

        const response = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/tables/${tableName}/rows`
        )

        const rows = response.data.value
        
        res.json({
            list: rows.map(r => ({ index: r.index, values: r.values[0] }))
        })
    } catch (error) {
        console.log(error?.response?.data)
        res.status(500).json({ message: "Failed to list data" })
    }
}

/**
 * Gets a single row from a SharePoint Excel table by its row index
 * 
 * @param {import('express').Request} req - Request with params: { code, index }, query: { fileName, tableName }
 * @param {import('express').Response} res - Response with { index, data: values[] }
 */
export async function getFromTable(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { code, index } = req.params
        const { fileName, tableName } = req.query

        const response = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/tables/${tableName}/rows/itemAt(index=${index})?$select=index,values`
        )

        const data = response.data

        res.json({ 
            index: data.index,
            data: data.values[0]
         })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to get manpower" })
    }
}

/**
 * Adds a new row to a SharePoint Excel table
 * Maps the form data to a row array using the columnMap, respecting formula columns
 * that should remain null (calculated by Excel formulas, not written by the API)
 * 
 * @param {import('express').Request} req - Request with params: { code }, query: { fileName, tableName }, body: { form, columnMap }
 * @param {import('express').Response} res - Response with { message, data: values[] }
 */
export async function addToTable(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { code } = req.params
        const { fileName, tableName } = req.query
        const { form, columnMap } = req.body

        let singleData = mapToRow(columnMap, form, tableName)

        const addedData = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/tables/${tableName}/rows/add`,
            { values: [singleData] }
        )

        const finalData = addedData.data

        res.json({
            message: tableName === 'EmployeeTable' ? 'Added Employee' : 'Added Billing Rate',
            data: finalData.values[0]
        })
    } catch (error) {
        console.log(error.response.data)
        res.status(500).json({ message: "Failed to add to table" })
    }
}

/**
 * Updates an existing row in a SharePoint Excel table by index
 * Uses a workbook session to ensure atomic updates with formula recalculation.
 * 
 * Session lifecycle: create session → patch row → recalculate formulas → close session
 * 
 * @param {import('express').Request} req - Request with params: { code, index }, query: { fileName, tableName }, body: { form, columnMap }
 * @param {import('express').Response} res - Response with { message, data: updatedRow }
 */
export async function updateRow(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { code, index } = req.params
        const { fileName, tableName } = req.query
        const { form, columnMap } = req.body

        const updatedRow = mapToRow(columnMap, form, tableName)

        // Create workbook session for consistent updates
        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        // Patch the specific row with updated values
        await graphRequest(
            'PATCH',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/tables/${tableName}/rows/itemAt(index=${index})`,
            { values: [updatedRow] },
            { headers: { 'workbook-session-id': sessionId } }
        )

        // Force recalculation of all formulas affected by the update
        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/application/calculate`,
            { calculationType: 'Full' },
            { headers: { 'workbook-session-id': sessionId } }
        )

        // Close workbook session to persist changes
        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/closeSession`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )

        res.json({
            message: 'Row updated successfully!',
            data: updatedRow
        })
    } catch (error) {
        console.log(error.response?.data || error)
        res.status(500).json({ message: 'Update manpower failed' })
    }
}

/**
 * Deletes a row from a SharePoint Excel table by index
 * Uses a workbook session to ensure atomic deletion with formula recalculation.
 * 
 * Session lifecycle: create session → delete row → recalculate formulas → close session
 * 
 * @param {import('express').Request} req - Request with params: { code, index }, query: { fileName, tableName }
 * @param {import('express').Response} res - Response with { message, success }
 */
export async function deleteFromTable(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { code, index } = req.params
        const { fileName, tableName } = req.query

        // Create workbook session for consistent delete
        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        // Delete the row at the specified index
        await graphRequest(
            'DELETE',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/tables/${tableName}/rows/itemAt(index=${index})`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )

        // Force recalculation of formulas affected by row deletion
        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/application/calculate`,
            { calculationType: 'Full' },
            { headers: { 'workbook-session-id': sessionId } }
        )

        // Close workbook session to persist changes
        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/root:/Templates/${code}/${fileName}:/workbook/closeSession`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )

        res.json({
            message: tableName === 'EmployeeTable' ? 'Deleted Employee' : 'Deleted Billing Rate',
            success: true
        })
    } catch (error) {
        console.log(error.response?.data || error)
        res.status(500).json({ message: 'Delete from table failed' })
    }
}

/**
 * Employee table columns that are computed by Excel formulas
 * These columns receive null values during row writes to preserve formula calculations
 * @type {string[]}
 */
const MANPOWER_FORMULA_COLUMNS = [
    'posName',
    'dept',
    'semiMonthlyRate',
    'endorsed',
    'difference'
]

/**
 * Rates/Position table columns that are computed by Excel formulas
 * @type {string[]}
 */
const RATES_FORMULA_COLUMNS = ['semiMonthlyRate']

/**
 * Maps form data to an ordered row array for Excel table insertion
 * 
 * For each column in the columnMap:
 * - If the column is a formula column for the given table type, returns null
 *   (preserves Excel formula calculations in those cells)
 * - Otherwise, returns the value from the form data if the key exists, or null
 * 
 * @param {string[]} columnMap - Ordered array of column names defining the row structure
 * @param {Object} data - Form data object with named keys matching column names
 * @param {string} tableName - Table name ('EmployeeTable' or 'PositionTable') to determine formula columns
 * @returns {Array<any>} Ordered array of cell values for the table row
 */
function mapToRow(columnMap, data, tableName) {
    return columnMap.map(col => {
        // Return null for formula columns to preserve Excel calculations
        if(tableName === 'EmployeeTable' && MANPOWER_FORMULA_COLUMNS.includes(col)) {
            return null
        }        
        else if(tableName === 'PositionTable' && RATES_FORMULA_COLUMNS.includes(col)) {
            return null
        }
        return col in data ? data[col] : null
    })
}

export async function createMonthlySuppliesBilling(req, res) {
    try {
        const { code } = req.params
        const { templateId, month, year } = req.body
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const fileName = `${code.toUpperCase()}-Monthly-Supplies-${month} ${year}.xlsx`

        const folder = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}`
        )

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${templateId}/copy`,
            {
                name: fileName,
                parentReference: { id: folder.data.id }
            },
            { validateStatus: s => s === 202 }
        )

        await new Promise(r => setTimeout(r, 5000))

        const children = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}:/children`
        )

        const excelFile = children.data.value.find(f => f.name === fileName)

        if (!excelFile) throw new Error('Copied Excel file not found')

        res.json({
            documentId: excelFile.id,
            editUrl: excelFile.webUrl,
            fileName
        })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to create monthly supplies billing' })
    }
}

export async function setupMonthlySuppliesBilling(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params
        const { month, year, period1, billingAmount1, period2, billingAmount2, annualRentalFee } = req.body

        const rental = ((annualRentalFee * 0.22) + annualRentalFee) / 12  // Monthly rental fee with 12% VAT and 10% Administrative fee

        const now = new Date()
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December']
        const dateCreated = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
        const monthPeriod = `FOR THE PERIOD OF ${month} ${year}`

        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        // Rename the first worksheet to the month name
        const worksheetsRes = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )

        const firstSheet = worksheetsRes.data.value[0]
        const sheet = month

        await graphRequest(
            'PATCH',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets/${firstSheet.id}`,
            { name: sheet },
            { headers: { 'workbook-session-id': sessionId } }
        )

        const cellUpdates = [
            ['C10', monthPeriod],
            ['C12', dateCreated],
            ['C20', period1],
            ['E20', billingAmount1],
            ['C21', period2],
            ['E21', billingAmount2],
            ['E23', rental]
        ]

        const batchRequests = cellUpdates.map(([cell, value], index) => ({
            id: `supplies-${index + 1}`,
            method: 'PATCH',
            url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${sheet}')/range(address='${cell}')`,
            headers: { 'Content-Type': 'application/json' },
            body: { values: [[value]] }
        }))

        await graphBatchRequest(batchRequests, sessionId)

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
            { calculationType: 'Full' }
        )

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )

        res.json({ message: 'Monthly supplies billing setup complete' })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to setup monthly supplies billing' })
    }
}

/**
 * Exports a SharePoint document as PDF using the Graph API's built-in conversion
 * Streams the PDF content directly to the client as an attachment
 * 
 * @param {import('express').Request} req - Request with params: { id } (SharePoint document ID)
 * @param {import('express').Response} res - Response with PDF binary stream (Content-Type: application/pdf)
 */
export async function exportToPdf(req, res) {
    const { id } = req.params
    const SITE_ID = process.env.SHAREPOINT_SITE_ID

    try {
        const pdf = await graphRequest(
            "GET",
            `/sites/${SITE_ID}/drive/items/${id}/content?format=pdf`
        )

        res.setHeader("Content-Type", "application/pdf")
        res.send(pdf.data)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Failed to export PDF', err })
    }
}
