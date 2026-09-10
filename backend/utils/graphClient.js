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
import {
    DOF_TEMPLATES,
    DOF_SOURCE_SHEETS,
    DOF_SOA_SHEETS,
    DOF_TABLES,
    DOF_PLACEHOLDERS,
    DOF_BILLING_TABLES,
    DOF_BILLING_FORMULA_INDICES,
    DOF_FORMULA_INDICES,
    DOF_DAY_FORMULA_INDICES,
} from '#config/dof.config.js'

/** Upper bound for any single throttle/backoff wait */
const THROTTLE_WAIT_CAP_MS = 60000

/**
 * True when Graph reports rate limiting: HTTP 429 or throttle error codes such
 * as FileOpenHostTooManyRequests / tooManyRequestsUncategorized. Workbook-host
 * throttling often returns these on non-429 statuses, with the finer-grained
 * code nested under error.innerError.code.
 */
const isThrottledResponse = (status, code, innerCode) =>
    status === 429 ||
    /toomanyrequests/i.test(code || '') ||
    /toomanyrequests/i.test(innerCode || '')

/**
 * Exponential backoff with jitter, capped at THROTTLE_WAIT_CAP_MS.
 * Starts at ~3s and roughly doubles each attempt so later retries ride out
 * workbook-host cooldown windows (FileOpenHost throttling can last a minute+).
 */
const backoffMs = attempt =>
    Math.min(3000 * Math.pow(2, attempt) + Math.random() * 1000, THROTTLE_WAIT_CAP_MS)

/** Prefers the Retry-After header when present; falls back to exponential backoff */
const throttleWaitMs = (retryAfterHeader, attempt) => {
    const retryAfterSec = parseInt(retryAfterHeader, 10)
    if (!isNaN(retryAfterSec) && retryAfterSec > 0) {
        return Math.min(retryAfterSec * 1000, THROTTLE_WAIT_CAP_MS)
    }
    return backoffMs(attempt)
}

/**
 * Sends an authenticated request to the Microsoft Graph API
 * Automatically acquires a bearer token, constructs the full Graph URL,
 * and merges custom headers/config into the axios request.
 * Retries throttled (429 / *TooManyRequests codes) and transient gateway
 * failures (502/503/504) with backoff, honoring the Retry-After header when
 * SharePoint provides one.
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {string} url - Graph API path (e.g., '/sites/{id}/drive/...') or full HTTPS URL
 * @param {any} [data=null] - Request body data
 * @param {Object} [config={}] - Additional axios config (headers, responseType, validateStatus, etc.)
 *   May also include `maxRetries` (default 5) to control the retry budget.
 * @returns {Promise<import('axios').AxiosResponse>} Axios response from the Graph API
 * @throws {Error} If no Graph token is available, or after retries are exhausted
 */
export async function graphRequest(method, url, data = null, config = {}) {
    let graphPath = url
    
    if(!graphPath.startsWith('/')) {
        graphPath = '/' + graphPath
    }

    // Use full URL if already absolute, otherwise prepend Graph v1.0 base
    const finalUrl = url.startsWith('https://')
        ? url
        : `https://graph.microsoft.com/v1.0${graphPath}`

    const { maxRetries = 5, ...axiosConfig } = config

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const token = await getGraphToken()
        
        if(!token) {
            throw new Error('Microsoft Graph is missing')
        }

        try {
            return await axios({
                method,
                url: finalUrl,
                data,
                ...axiosConfig,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...(axiosConfig.headers || {})
                }
            })
        } catch (err) {
            const status = err?.response?.status
            const code = err?.response?.data?.error?.code
            const innerCode = err?.response?.data?.error?.innerError?.code
            const message = err?.response?.data?.error?.message

            const throttled = isThrottledResponse(status, code, innerCode)
            const transient = status === 502 || status === 503 || status === 504 ||
                /timeout|serviceunavailable|temporarilyunavailable/i.test(code || '')

            if ((!throttled && !transient) || attempt === maxRetries) throw err

            const waitMs = throttled
                ? throttleWaitMs(err?.response?.headers?.['retry-after'], attempt)
                : backoffMs(attempt)

            console.warn(
                `Graph request ${method} ${graphPath} throttled/failed (${status ?? err?.message}), ` +
                `retrying in ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${maxRetries})`
            )
            await new Promise(r => setTimeout(r, waitMs))
        }
    }
}

/**
 * Sends a batch of requests to the Microsoft Graph API in a single HTTP call
 * Uses the $batch endpoint for atomic multi-operation execution within a workbook session.
 * Retries throttled requests (HTTP 429 or *TooManyRequests codes, including
 * FileOpenHostTooManyRequests and the nested tooManyRequestsUncategorized) and
 * transient gateway/timeout failures (502/503/504, e.g.
 * FileOpenBaseDocumentCheckHostTimeout) with backoff, recreating the
 * workbook session via `refreshSession` when it expires or the host wedges mid-save.
 * Throws if any individual request in the batch returns a 4xx/5xx status after retries.
 * 
 * @param {Array<{ id: string, method: string, url: string, headers?: Object, body?: any }>} requests - Array of batch request objects
 * @param {string} sessionId - Active workbook session ID for consistent operations
 * @param {Object} [options] - { maxRetries: number, refreshSession: () => Promise<string> }
 *   `refreshSession` closes the expired session, creates a new one, and returns its ID
 * @returns {Promise<Object>} Batch response data containing individual response results
 * @throws {Error} If any batch operation fails with status >= 400
 */
export async function graphBatchRequest(requests, sessionId, options = {}) {
    const { maxRetries = 5, refreshSession } = options

    let pending = requests

    const isInvalidSession = obj =>
        /invalidsession/i.test(obj?.error?.code || '')

    // Transient workbook-host failures (gateway timeouts, host can't open the
    // file) typically succeed on retry with a fresh session. Also catches
    // 500 UnknownError wrapping a WAC "Service Unavailable" HTML page, which
    // Excel Online returns transiently under sustained write load.
    const isTransientFailure = (status, code, message) =>
        status === 502 || status === 503 || status === 504 ||
        /timeout|serviceunavailable|temporarilyunavailable/i.test(code || '') ||
        (status === 500 &&
            /unknownerror/i.test(code || '') &&
            /service is unavailable|WACError|technical difficulties/i.test(message || ''))

    const waitForThrottle = async (retryAfterValues, attempt) => {
        const retryAfter = retryAfterValues
            .map(v => parseInt(v, 10))
            .filter(n => !isNaN(n) && n > 0)

        let waitMs = retryAfter.length > 0
            ? Math.max(...retryAfter) * 1000
            : backoffMs(attempt)

        waitMs = Math.min(waitMs, THROTTLE_WAIT_CAP_MS)

        console.warn(`Graph batch throttled, retrying in ${Math.round(waitMs)}ms`)

        if (waitMs > 15000 && refreshSession) {
            try {
                const newSessionId = await refreshSession()
                if (newSessionId) sessionId = newSessionId
            } catch (err) {
                console.warn('Session refresh failed during throttle wait:', err?.message)
            }
        }

        await new Promise(r => setTimeout(r, waitMs))
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const token = await getGraphToken()

        const res = await axios.post(
            'https://graph.microsoft.com/v1.0/$batch',
            { requests: pending },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'workbook-session-id': sessionId
                },
                validateStatus: () => true
            }
        )

        // Whole batch rejected, e.g. invalid workbook session or throttled endpoint
        if (res.status >= 400) {
            if (isInvalidSession(res.data) && refreshSession && attempt < maxRetries) {
                console.warn('Workbook session invalid, recreating session and retrying batch')
                const newSessionId = await refreshSession()
                if (newSessionId) sessionId = newSessionId
                continue
            }

            if (isThrottledResponse(res.status, res.data?.error?.code, res.data?.error?.innerError?.code) && attempt < maxRetries) {
                await waitForThrottle([res.headers?.['retry-after']], attempt)
                continue
            }

            if (isTransientFailure(res.status, res.data?.error?.code, res.data?.error?.message) && attempt < maxRetries) {
                console.warn(`Batch request hit transient error ${res.status}, refreshing session and retrying`)
                if (refreshSession) {
                    try {
                        const newSessionId = await refreshSession()
                        if (newSessionId) sessionId = newSessionId
                    } catch (err) {
                        console.warn('Session refresh failed during transient retry:', err?.message)
                    }
                }
                await new Promise(r => setTimeout(r, backoffMs(attempt)))
                continue
            }

            console.error('Batch request failed: ', res.data?.error || res.data)
            throw new Error('Some batch operations failed')
        }

        const failed = res.data.responses.filter(r => r.status >= 400)

        if (failed.length === 0) {
            return res.data
        }

        const invalidSessionFailures = failed.filter(r => isInvalidSession(r.body))

        if (invalidSessionFailures.length > 0 && refreshSession && attempt < maxRetries) {
            console.warn('Batch operations report invalid session, recreating session and retrying')
            const newSessionId = await refreshSession()
            if (newSessionId) sessionId = newSessionId
            continue
        }

        const throttled = failed.filter(r =>
            isThrottledResponse(r.status, r.body?.error?.code, r.body?.error?.innerError?.code)
        )

        if (throttled.length > 0 && attempt < maxRetries) {
            const retryAfterValues = throttled.flatMap(r => {
                const headers = r.headers || {}
                const value = headers['Retry-After'] ?? headers['retry-after']
                return value ? [value] : []
            })

            await waitForThrottle(retryAfterValues, attempt)

            const failedIds = new Set(failed.map(f => f.id))
            pending = requests.filter(r => failedIds.has(r.id))
            continue
        }

        // Workbook-host timeouts (e.g. FileOpenBaseDocumentCheckHostTimeout) —
        // retry only when every failure is transient so hard errors still throw.
        const transient = failed.filter(r =>
            isTransientFailure(r.status, r.body?.error?.code || r.body?.error?.innerError?.code, r.body?.error?.message)
        )

        if (transient.length > 0 && transient.length === failed.length && attempt < maxRetries) {
            console.warn(`${transient.length} batch operation(s) hit transient workbook errors, refreshing session and retrying`)

            if (refreshSession) {
                try {
                    const newSessionId = await refreshSession()
                    if (newSessionId) sessionId = newSessionId
                } catch (err) {
                    console.warn('Session refresh failed during transient retry:', err?.message)
                }
            }

            await new Promise(r => setTimeout(r, backoffMs(attempt)))

            const failedIds = new Set(transient.map(f => f.id))
            pending = requests.filter(r => failedIds.has(r.id))
            continue
        }

        for (const failure of failed) {
            console.error('Batch failures: ', failure.body.error)
        }

        throw new Error('Some batch operations failed')
    }
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

        // Helper to parse date and extract UTC components (avoids timezone issues)
        const getDateParts = (dateStr) => {
            const date = new Date(dateStr)
            return {
                year: date.getUTCFullYear(),
                month: date.getUTCMonth() + 2,
                day: date.getUTCDate() + 1
            }
        }

        const billingDate = getDateParts(data.billingDate)
        const monthAndYear = getDateParts(data.monthAndYear)

        // Cell-value pairs for the BILLING LETTER sheet using Excel DATE function for accurate dates
        const billingUpdates = [
            ['I4', `=CONCAT("SOA NO: PMS ", TEXT(DATE(${monthAndYear.year}, ${monthAndYear.month}, 1), "yyyy"))`],
            ['I5', `=UPPER(TEXT(DATE(${monthAndYear.year}, ${monthAndYear.month}, 1), "mmmm"))`],
            ['I6', `=UPPER(TEXT(DATE(${monthAndYear.year}, ${monthAndYear.month}, ${billingDate.day}), "mmmm dd, yyyy"))`],
            ['A20', `=CONCAT("Property security and upkeep services rendered by LBRDC as of ", TEXT(DATE(${monthAndYear.year}, ${monthAndYear.month}, 1), "mmmm yyyy"))`],
            ['A21', `for ${data.clientName}`],
            ['B25', `=UPPER(TEXT(DATE(${monthAndYear.year}, ${monthAndYear.month}, 1), "mmmm yyyy"))`],
            ['K25', data.amount],
            ['K29', '=SUM(K22:K28)'],
            ['I35', `PMC NO. ${data.pmcNo}`],
            ['B37', `=UPPER(TEXT(DATE(${monthAndYear.year}, ${monthAndYear.month}, 1), "mmmm yyyy"))`],
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
            ['B11', `=UPPER(TEXT(DATE(${billingDate.year}, ${billingDate.month-1}, ${billingDate.day}), "mmmm dd, yyyy"))`],
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

        const now = new Date()
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
        const fileName = `${code.toUpperCase()}-Billing-${dateRange.label}-${timestamp}.xlsm`

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
        const { dateRange, soaNo } = req.body

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
            },
            {
                id: 'date-4',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('OFBANK MANPOWER')/range(address='G6')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[`SOA NO. ${soaNo}`]] }
            }
        ]

        await graphBatchRequest(dateBatch, sessionId)

        const signatoryBatch = [
            {
                id: 'sig-1',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('MISS')/range(address='B33')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[acctAsst.toUpperCase()]] }
            },
            {
                id: 'sig-2',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('MISS')/range(address='E33')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[bcuChief.toUpperCase()]] }
            }
        ]

        await graphBatchRequest(signatoryBatch, sessionId)

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

        const now = new Date()
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
        const fileName = `${code.toUpperCase()}-Monthly-Supplies-${month} ${year}-${timestamp}.xlsx`

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
        const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
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

// ==========================================
// BTR MISS BILLING FUNCTIONS
// ==========================================

export async function createBtrMissBilling(req, res) {
    try {
        const { code } = req.params
        const { templateId, dateRange } = req.body
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const now = new Date()
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
        const fileName = `${code.toUpperCase()}-MISS-Billing-${dateRange.label}-${timestamp}.xlsm`

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
        res.status(500).json({ message: 'Failed to create BTr MISS billing' })
    }
}

export async function setupBtrMissBilling(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params
        const { dateRange, soaNo_MISS, billingPeriod, acctAsst, bcuChief } = req.body

        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        const itSheetName = `IT Billing ${dateRange.sheetLabel}`

        const renameBatch = [
            {
                id: 'rename-1',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets/{itBillingSheet}`,
                headers: { 'Content-Type': 'application/json' },
                body: { name: itSheetName }
            }
        ]

        await graphBatchRequest(renameBatch, sessionId)

        const dateBatch = [
            {
                id: 'date-1',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${itSheetName}')/range(address='A4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['for the period ' + dateRange.label]] }
            },
            {
                id: 'date-2',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('MISS')/range(address='B4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['FOR THE PERIOD OF ' + billingPeriod]] }
            },
            {
                id: 'date-3',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('MISS')/range(address='H6')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[`SOA NO. ${soaNo_MISS}`]] }
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

        res.json({ message: 'BTr MISS billing setup complete' })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to setup BTr MISS billing' })
    }
}

export async function getBtrMissTables(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params

        const itRes = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/tables('itBillingTable')/rows`
        )

        res.json({
            itBilling: itRes.data.value.map(r => ({ index: r.index, values: r.values[0] }))
        })
    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to read BTr MISS billing tables' })
    }
}

export async function saveBtrMissTables(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params
        const { itBillingRows } = req.body

        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        const ITBILLING_FORMULA_INDICES = [0, 2, 3, 4, 5, 6]

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

        const itBatch = buildBatchRequests(itBillingRows, 'itBillingTable', ITBILLING_FORMULA_INDICES)

        for (let i = 0; i < itBatch.length; i += 20) {
            const chunk = itBatch.slice(i, i + 20)
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

        res.json({ message: 'BTr MISS billing data saved successfully' })
    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to save BTr MISS billing data' })
    }
}

// ==========================================
// BTR JANITORIAL BILLING FUNCTIONS
// ==========================================

export async function createBtrJanitorialBilling(req, res) {
    try {
        const { code } = req.params
        const { templateId, dateRange } = req.body
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const now = new Date()
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
        const fileName = `${code.toUpperCase()}-Janitorial-Billing-${dateRange.label}-${timestamp}.xlsm`

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
        res.status(500).json({ message: 'Failed to create BTr Janitorial billing' })
    }
}

export async function setupBtrJanitorialBilling(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params
        const { dateRange, soaNo_JANITORIAL, soaNo_HAULER, soaNo_TFMCD, soaNo_OVERTIME, acctAsst, bcuChief } = req.body

        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        const jSheetName = `Janitorial Billing ${dateRange.sheetLabel}`

        const renameBatch = [
            {
                id: 'rename-1',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets/{jBillingSheet}`,
                headers: { 'Content-Type': 'application/json' },
                body: { name: jSheetName }
            }
        ]

        await graphBatchRequest(renameBatch, sessionId)

        const dateBatch = [
            {
                id: 'date-1',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${jSheetName}')/range(address='A4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['for the period ' + dateRange.label]] }
            },
            {
                id: 'date-2',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('JANITORIAL')/range(address='B4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['FOR THE PERIOD OF ' + dateRange.label]] }
            },
            {
                id: 'date-3',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('JANITORIAL')/range(address='G6')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[`SOA NO. ${soaNo_JANITORIAL}`]] }
            },
            {
                id: 'date-4',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('BTr-HAULER')/range(address='B4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['FOR THE PERIOD OF ' + dateRange.label]] }
            },
            {
                id: 'date-5',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('BTr-HAULER')/range(address='G6')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[`SOA NO. ${soaNo_HAULER}`]] }
            },
            {
                id: 'date-6',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('BTr-TFMCD')/range(address='B4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['FOR THE PERIOD OF ' + dateRange.label]] }
            },
            {
                id: 'date-7',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('BTr-TFMCD')/range(address='G6')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[`SOA NO. ${soaNo_TFMCD}`]] }
            },
            {
                id: 'date-8',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('JANITORIAL OVERTIME')/range(address='B4')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [['FOR THE PERIOD OF ' + dateRange.label]] }
            },
            {
                id: 'date-9',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('JANITORIAL OVERTIME')/range(address='G6')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[`SOA NO. ${soaNo_OVERTIME}`]] }
            }
        ]

        await graphBatchRequest(dateBatch, sessionId)

        const signatoryBatch = [
            {
                id: 'sig-1',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('JANITORIAL')/range(address='B117')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[acctAsst.toUpperCase()]] }
            },
            {
                id: 'sig-2',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('JANITORIAL')/range(address='E117')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[bcuChief.toUpperCase()]] }
            },
            {
                id: 'sig-3',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('JANITORIAL OVERTIME')/range(address='B31')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[acctAsst.toUpperCase()]] }
            },
            {
                id: 'sig-4',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('JANITORIAL OVERTIME')/range(address='D31')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[bcuChief.toUpperCase()]] }
            },
            {
                id: 'sig-5',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('BTr-HAULER')/range(address='B29')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[acctAsst.toUpperCase()]] }
            },
            {
                id: 'sig-6',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('BTr-HAULER')/range(address='E29')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[bcuChief.toUpperCase()]] }
            },
            {
                id: 'sig-7',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('BTr-TFMCD')/range(address='B23')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[acctAsst.toUpperCase()]] }
            },
            {
                id: 'sig-8',
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('BTr-TFMCD')/range(address='E23')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[bcuChief.toUpperCase()]] }
            }
        ]

        await graphBatchRequest(signatoryBatch, sessionId)

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

        res.json({ message: 'BTr Janitorial billing setup complete' })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to setup BTr Janitorial billing' })
    }
}

export async function getBtrJanitorialTables(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params

        const jRes = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/tables('jBillingTable')/rows`
        )

        res.json({
            jBilling: jRes.data.value.map(r => ({ index: r.index, values: r.values[0] }))
        })
    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to read BTr Janitorial billing tables' })
    }
}

export async function saveBtrJanitorialTables(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params
        const { jBillingRows } = req.body

        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        const JBILLING_FORMULA_INDICES = [0, 2, 3, 4, 5, 6]

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

        for (let i = 0; i < jBatch.length; i += 20) {
            const chunk = jBatch.slice(i, i + 20)
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

        res.json({ message: 'BTr Janitorial billing data saved successfully' })
    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to save BTr Janitorial billing data' })
    }
}

// ==========================================
// BTR SUPPLIES BILLING FUNCTIONS
// ==========================================

export async function createBtrSuppliesBilling(req, res) {
    try {
        const { code } = req.params
        const { templateId, month, year } = req.body
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const now = new Date()
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
        const fileName = `${month.toUpperCase()} BTR JANITORIAL, UTILITY & SUPPLIES ${year}-${timestamp}.xlsx`

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
        res.status(500).json({ message: 'Failed to create BTr supplies billing' })
    }
}

export async function setupBtrSuppliesBilling(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { fileId } = req.params
        const {
            month,
            year,
            particulars,
            billingMonth,
            period1,
            period2,
            mAmount1,
            mAmount2,
            sAmount,
            aaName,
            bcuChief,
            supplyRows
        } = req.body

        const now = new Date()
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December']
        const dateCreated = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

        const session = await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
            { persistChanges: true }
        )

        const sessionId = session.data.id

        const worksheetsRes = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )

        const templateSheet = worksheetsRes.data.value.find(w => w.name === '{monthYear}')
        const sheetName = `${month.toUpperCase()} ${year}`

        if (templateSheet) {
            await graphRequest(
                'PATCH',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets/${templateSheet.id}`,
                { name: sheetName },
                { headers: { 'workbook-session-id': sessionId } }
            )
        }

        const cellUpdates = [
            ['C12', particulars],
            ['C13', billingMonth],
            ['C15', dateCreated],
            ['C23', period1],
            ['C24', period2],
            ['E23', mAmount1],
            ['E24', mAmount2],
            ['E26', sAmount],
            ['A38', aaName.toUpperCase()],
            ['E38', bcuChief.toUpperCase()]
        ]

        const batchRequests = cellUpdates.map(([cell, value], index) => ({
            id: `supplies-${index + 1}`,
            method: 'PATCH',
            url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='${cell}')`,
            headers: { 'Content-Type': 'application/json' },
            body: { values: [[value]] }
        }))

        await graphBatchRequest(batchRequests, sessionId)

        if (Array.isArray(supplyRows) && supplyRows.length > 0) {
            for (let i = 0; i < supplyRows.length; i++) {
                await graphRequest(
                    'POST',
                    `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='A27:E27')/insert`,
                    { shift: 'Down' },
                    { headers: { 'workbook-session-id': sessionId } }
                )
            }

            const rowBatch = supplyRows.map((row, index) => ({
                id: `row-${index + 1}`,
                method: 'PATCH',
                url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='A${27 + index}:E${27 + index}')`,
                headers: { 'Content-Type': 'application/json' },
                body: { values: [[row.field, null, null, null, row.amount]] }
            }))

            for (let i = 0; i < rowBatch.length; i += 20) {
                const chunk = rowBatch.slice(i, i + 20)
                await graphBatchRequest(chunk, sessionId)
            }

            await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${sheetName}')/range(address='A${27 + supplyRows.length}:E${27 + supplyRows.length}')/insert`,
                { shift: 'Down' },
                { headers: { 'workbook-session-id': sessionId } }
            )
        }

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
            { calculationType: 'Full' },
            { headers: { 'workbook-session-id': sessionId } }
        )

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )

        res.json({ message: 'BTr supplies billing setup complete' })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to setup BTr supplies billing' })
    }
}

// ==========================================
// DOF BILLING FUNCTIONS
// ==========================================

async function findDofTemplate(code, templateName) {
    const SITE_ID = process.env.SHAREPOINT_SITE_ID
    const response = await graphRequest(
        'GET',
        `/sites/${SITE_ID}/drive/root:/Templates/${code}:/children`
    )
    return response.data.value.find(f => f.name === templateName)
}

export async function createDofTimekeeping(req, res) {
    try {
        const { code } = req.params
        const { dateRange, year, month, billingPeriod } = req.body
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const now = new Date()
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
        const periodLabel = billingPeriod || dateRange.sheetLabel?.replace(/\s+/g, '-')
        const suffix = `${month}-${periodLabel}-${year}-${timestamp}`

        const folder = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}`
        )

        const prefixes = {
            jan: `A_JAN-${suffix}`,
            oms: `B_OMS-${suffix}`,
            man: `C_MAN-${suffix}`,
        }

        const files = {}

        for (const [key, templateName] of Object.entries(DOF_TEMPLATES.timekeeping)) {
            const template = await findDofTemplate(code, templateName)
            if (!template) {
                throw new Error(`Timekeeping template ${templateName} not found`)
            }

            const fileName = `${prefixes[key]}.xlsx`

            await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${template.id}/copy`,
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

            if (!excelFile) {
                throw new Error(`Copied timekeeping file ${fileName} not found`)
            }

            files[key] = {
                documentId: excelFile.id,
                editUrl: excelFile.webUrl,
                fileName
            }
        }

        res.json(files)

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to create DOF timekeeping files' })
    }
}

export async function createDofBilling(req, res) {
    try {
        const { code } = req.params
        const { dateRange } = req.body
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const template = await findDofTemplate(code, DOF_TEMPLATES.billing)
        if (!template) {
            throw new Error(`Billing template ${DOF_TEMPLATES.billing} not found`)
        }

        const now = new Date()
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
        const fileName = `${code.toUpperCase()}-BILLING-${dateRange.label}-${timestamp}.xlsm`

        const folder = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/${code}`
        )

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${template.id}/copy`,
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

        if (!excelFile) throw new Error('Copied DOF billing file not found')

        res.json({
            documentId: excelFile.id,
            editUrl: excelFile.webUrl,
            fileName
        })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to create DOF billing file' })
    }
}

/**
 * Replaces {placeholder} tokens in a DOF billing workbook (e.g. {billingPeriod},
 * {soaNo}, {acctAsst}, {bcuChief}).
 * Scans each worksheet's used range via its `formulas` matrix — only literal
 * string cells (not starting with '=') containing a token are rewritten, so
 * formula cells are never clobbered. Matched cells are written back in batches
 * of 20 inside a single workbook session, followed by a full recalculation.
 *
 * @param {string} fileId - SharePoint drive item ID of the billing workbook
 * @param {Record<string, string>} replacements - Map of '{token}' -> replacement text
 * @param {string[]} [sheets] - Optional worksheet name filter (case-insensitive); all sheets when omitted
 */
async function replaceDofPlaceholders(fileId, replacements, sheets = null) {
    const SITE_ID = process.env.SHAREPOINT_SITE_ID
    const keys = Object.keys(replacements).filter(k => k)
    if (keys.length === 0) return

    const colLetter = i => {
        let s = ''
        i += 1
        while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26) }
        return s
    }

    const session = await graphRequest(
        'POST',
        `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
        { persistChanges: true }
    )
    const sessionId = session.data.id

    try {
        const worksheetsRes = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets`,
            null,
            { headers: { 'workbook-session-id': sessionId } }
        )
        let sheetNames = worksheetsRes.data.value.map(w => w.name)
        if (sheets) {
            const wanted = new Set(sheets.map(s => s.toLowerCase()))
            sheetNames = sheetNames.filter(n => wanted.has(n.toLowerCase()))
        }

        const writes = []
        for (const sheet of sheetNames) {
            const rangeRes = await graphRequest(
                'GET',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${sheet}')/usedRange`,
                null,
                { headers: { 'workbook-session-id': sessionId } }
            )
            const formulas = rangeRes.data.formulas
            if (!formulas) continue
            const rowOffset = rangeRes.data.rowIndex ?? 0
            const colOffset = rangeRes.data.columnIndex ?? 0

            for (let r = 0; r < formulas.length; r++) {
                for (let c = 0; c < formulas[r].length; c++) {
                    const cell = formulas[r][c]
                    if (typeof cell !== 'string' || cell.startsWith('=')) continue
                    let newText = cell
                    for (const key of keys) {
                        if (newText.includes(key)) newText = newText.split(key).join(replacements[key])
                    }
                    if (newText !== cell) {
                        writes.push({
                            id: `${sheet}-${rowOffset + r}-${colOffset + c}`,
                            method: 'PATCH',
                            url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${sheet}')/range(address='${colLetter(colOffset + c)}${rowOffset + r + 1}')`,
                            headers: { 'Content-Type': 'application/json' },
                            body: { values: [[newText]] }
                        })
                    }
                }
            }
        }

        for (let i = 0; i < writes.length; i += 20) {
            await graphBatchRequest(writes.slice(i, i + 20), sessionId)
        }

        await graphRequest(
            'POST',
            `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
            { calculationType: 'Full' },
            { headers: { 'workbook-session-id': sessionId } }
        )
    } finally {
        try {
            await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
                null,
                { headers: { 'workbook-session-id': sessionId } }
            )
        } catch (err) {
            console.warn('Failed to close DOF placeholder session:', err?.response?.data || err.message)
        }
    }
}

/**
 * Lists DOF billing draft files from SharePoint (BillingLetterDrafts/DOF),
 * newest first, for the standalone signatories component's file picker
 * 
 * @param {import('express').Request} req - Request with no required params
 * @param {import('express').Response} res - Response with array of { id, name, lastModifiedDateTime, webUrl }
 */
export async function listDofBillingDrafts(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID

        const response = await graphRequest(
            'GET',
            `/sites/${SITE_ID}/drive/root:/BillingLetterDrafts/DOF:/children`
        )

        const drafts = response.data.value
            .filter(f => f.name.startsWith('DOF-BILLING-'))
            .sort((a, b) => new Date(b.lastModifiedDateTime) - new Date(a.lastModifiedDateTime))
            .map(f => ({ id: f.id, name: f.name, lastModifiedDateTime: f.lastModifiedDateTime, webUrl: f.webUrl }))

        res.json(drafts)
    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to list DOF billing drafts' })
    }
}

export async function setupDofBilling(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const { billingId } = req.params
        const { dateRange, timekeepingFiles, year, month, billingPeriod } = req.body

        const fullMonth = month || dateRange.label.split(' ')[0]
        const period = billingPeriod || dateRange.label.split(' ')[1].replace(',', '')
        const yr = year || dateRange.label.split(' ')[2]
        const threeLetterMonth = fullMonth.substring(0, 3).toUpperCase()

        const janOmsPeriodLabel = `FOR THE PERIOD ${fullMonth} ${period}, ${yr}`
        const manPeriodLabel = `FOR THE PERIOD ${threeLetterMonth} ${period}, ${yr}`
        const twoDigitPeriod = period.split('-').map(d => String(d).padStart(2, '0')).join('-')
        const billingPeriodLabel = `for the period ${fullMonth.toUpperCase()} ${twoDigitPeriod}, ${yr}`

        const categoryPeriodLabels = {
            jan: janOmsPeriodLabel,
            oms: janOmsPeriodLabel,
            man: manPeriodLabel,
        }

        const billingSheetNames = {
            jan: `JAN ${threeLetterMonth} ${period} ${yr}`,
            oms: `OMS ${threeLetterMonth} ${period} ${yr}`,
            man: `MAN ${threeLetterMonth} ${period} ${yr}`,
        }

        async function setupBillingFile(fileId) {
            const session = await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
                { persistChanges: true }
            )

            const sessionId = session.data.id

            const renameBatch = [
                {
                    id: 'rename-man',
                    method: 'PATCH',
                    url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${DOF_SOURCE_SHEETS.billing.man}')`,
                    headers: { 'Content-Type': 'application/json' },
                    body: { name: billingSheetNames.man }
                },
                {
                    id: 'rename-oms',
                    method: 'PATCH',
                    url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${DOF_SOURCE_SHEETS.billing.oms}')`,
                    headers: { 'Content-Type': 'application/json' },
                    body: { name: billingSheetNames.oms }
                },
                {
                    id: 'rename-jan',
                    method: 'PATCH',
                    url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${DOF_SOURCE_SHEETS.billing.jan}')`,
                    headers: { 'Content-Type': 'application/json' },
                    body: { name: billingSheetNames.jan }
                }
            ]

            await graphBatchRequest(renameBatch, sessionId)

            await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
                { calculationType: 'Full' },
                { headers: { 'workbook-session-id': sessionId } }
            )

            await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
                null,
                { headers: { 'workbook-session-id': sessionId } }
            )
        }

        async function setupTimekeepingFile(fileId, category) {
            const sourceSheet = DOF_SOURCE_SHEETS.timekeeping[category]

            const session = await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
                { persistChanges: true }
            )

            const sessionId = session.data.id

            const worksheetsRes = await graphRequest(
                'GET',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets`,
                null,
                { headers: { 'workbook-session-id': sessionId } }
            )
            const availableSheets = worksheetsRes.data.value.map(w => w.name)

            const matchedSource = availableSheets.find(name => name.toLowerCase() === sourceSheet.toLowerCase())
            if (!matchedSource) {
                console.error(`[DOF] Worksheet '${sourceSheet}' not found in timekeeping file ${fileId}. Available sheets:`, availableSheets)
                throw new Error(`Worksheet '${sourceSheet}' not found in timekeeping file`)
            }

            const periodLabel = categoryPeriodLabels[category]
            const periodSheetCandidates = ['Summary of Timekeep', 'BUDGET UTILIZATION']
            if (category === 'jan') {
                periodSheetCandidates.push('TARDINESS REPORT')
            }

            const periodSheets = periodSheetCandidates.map(sheet => {
                const matched = availableSheets.find(name => name.toLowerCase() === sheet.toLowerCase())
                if (!matched) {
                    console.warn(`[DOF] Worksheet '${sheet}' not found in timekeeping file ${fileId}`)
                }
                return matched
            }).filter(Boolean)

            const periodBatch = [
                ...periodSheets.map(sheet => ({
                    id: `period-label-${category}-${sheet}`,
                    method: 'PATCH',
                    url: `/sites/${SITE_ID}/drive/items/${fileId}/workbook/worksheets('${sheet}')/range(address='A3')`,
                    headers: { 'Content-Type': 'application/json' },
                    body: { values: [[periodLabel]] }
                }))
            ]

            if (periodBatch.length > 0) {
                await graphBatchRequest(periodBatch, sessionId)
            }

            await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
                { calculationType: 'Full' },
                { headers: { 'workbook-session-id': sessionId } }
            )

            await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
                null,
                { headers: { 'workbook-session-id': sessionId } }
            )
        }

        await setupBillingFile(billingId)

        if (timekeepingFiles) {
            for (const [category, fileId] of Object.entries(timekeepingFiles)) {
                if (!fileId) continue
                await setupTimekeepingFile(fileId, category)
            }
        }

        // Replace {billingPeriod} tokens across the billing workbook. Runs after
        // the renames above since the helper lists worksheets fresh.
        await replaceDofPlaceholders(billingId, { [DOF_PLACEHOLDERS.billingPeriod]: billingPeriodLabel })

        res.json({ message: 'DOF billing setup complete' })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to setup DOF billing' })
    }
}

export async function getDofTables(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const billingId = req.params.fileId
        const { janId, omsId, manId } = req.query

        async function getAllRows(fileId, tableName) {
            const rows = []
            let url = `/sites/${SITE_ID}/drive/items/${fileId}/workbook/tables('${tableName}')/rows`
            while (url) {
                const page = await graphRequest('GET', url)
                rows.push(...(page.data.value ?? []))
                url = page.data['@odata.nextLink'] ?? null
            }
            return rows
        }

        const mapRows = rows => rows.map(r => ({ index: r.index, values: r.values[0] }))

        const [janRows, omsRows, manRows, janBillingRows, omsBillingRows, manBillingRows] = await Promise.all([
            getAllRows(janId, DOF_TABLES.jan),
            getAllRows(omsId, DOF_TABLES.oms),
            getAllRows(manId, DOF_TABLES.man),
            getAllRows(billingId, DOF_BILLING_TABLES.jan),
            getAllRows(billingId, DOF_BILLING_TABLES.oms),
            getAllRows(billingId, DOF_BILLING_TABLES.man),
        ])

        res.json({
            jan: mapRows(janRows),
            oms: mapRows(omsRows),
            man: mapRows(manRows),
            janBilling: mapRows(janBillingRows),
            omsBilling: mapRows(omsBillingRows),
            manBilling: mapRows(manBillingRows),
        })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to read DOF billing tables' })
    }
}

export async function saveDofTables(req, res) {
    try {
        const SITE_ID = process.env.SHAREPOINT_SITE_ID
        const billingId = req.params.fileId
        const { janRows, omsRows, manRows, janBillingRows, omsBillingRows, manBillingRows, timekeepingFiles } = req.body

        // Timekeeping rows use block/day formula protection; billing rows carry
        // per-employee aggregates and only protect the billing formula columns.
        const categories = [
            { rows: janRows, tableName: DOF_TABLES.jan, fileId: timekeepingFiles?.jan, formulaIndices: DOF_FORMULA_INDICES.jan, dayFormulaIndices: DOF_DAY_FORMULA_INDICES.jan },
            { rows: omsRows, tableName: DOF_TABLES.oms, fileId: timekeepingFiles?.oms, formulaIndices: DOF_FORMULA_INDICES.oms, dayFormulaIndices: DOF_DAY_FORMULA_INDICES.oms },
            { rows: manRows, tableName: DOF_TABLES.man, fileId: timekeepingFiles?.man, formulaIndices: DOF_FORMULA_INDICES.man, dayFormulaIndices: DOF_DAY_FORMULA_INDICES.man },
            { rows: janBillingRows, tableName: DOF_BILLING_TABLES.jan, fileId: billingId, formulaIndices: DOF_BILLING_FORMULA_INDICES.jan, dayFormulaIndices: null },
            { rows: omsBillingRows, tableName: DOF_BILLING_TABLES.oms, fileId: billingId, formulaIndices: DOF_BILLING_FORMULA_INDICES.oms, dayFormulaIndices: null },
            { rows: manBillingRows, tableName: DOF_BILLING_TABLES.man, fileId: billingId, formulaIndices: DOF_BILLING_FORMULA_INDICES.man, dayFormulaIndices: null },
        ]

        const createSession = async fileId => {
            const session = await graphRequest(
                'POST',
                `/sites/${SITE_ID}/drive/items/${fileId}/workbook/createSession`,
                { persistChanges: true }
            )
            return session.data.id
        }

        const refreshSession = async (fileId, sessionId) => {
            try {
                await graphRequest(
                    'POST',
                    `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
                    null,
                    { headers: { 'workbook-session-id': sessionId } }
                )
            } catch (err) {
                console.warn('Failed to close expired DOF workbook session:', err?.response?.data || err.message)
            }
            return createSession(fileId)
        }

        // Group row writes by target file so each file is saved in one session
        const requestsByFile = new Map()
        for (const category of categories) {
            if (!category.fileId || !category.rows || category.rows.length === 0) {
                continue
            }

            const requests = category.rows.map(row => {
                const protectedIndices = row.type === 'day' && category.dayFormulaIndices
                    ? category.dayFormulaIndices
                    : category.formulaIndices
                const values = row.values.map((val, i) =>
                    protectedIndices.includes(i) ? null : val
                )
                return {
                    id: `${category.tableName}-${row.index}`,
                    method: 'PATCH',
                    url: `/sites/${SITE_ID}/drive/items/${category.fileId}/workbook/tables('${category.tableName}')/rows/itemAt(index=${row.index})`,
                    headers: { 'Content-Type': 'application/json' },
                    body: { values: [values] }
                }
            })

            const existing = requestsByFile.get(category.fileId) ?? []
            requestsByFile.set(category.fileId, existing.concat(requests))
        }

        for (const [fileId, requests] of requestsByFile) {
            let sessionId = await createSession(fileId)
            let lastRefresh = Date.now()

            const onRefresh = async () => {
                sessionId = await refreshSession(fileId, sessionId)
                lastRefresh = Date.now()
                return sessionId
            }

            try {
                for (let i = 0; i < requests.length; i += 20) {
                    if (Date.now() - lastRefresh > 30000) {
                        await onRefresh()
                    }

                    const chunk = requests.slice(i, i + 20)
                    await graphBatchRequest(chunk, sessionId, { refreshSession: onRefresh })

                    if (i + 20 < requests.length) {
                        await new Promise(r => setTimeout(r, 1000))
                    }
                }

                await graphRequest(
                    'POST',
                    `/sites/${SITE_ID}/drive/items/${fileId}/workbook/application/calculate`,
                    { calculationType: 'Full' },
                    { headers: { 'workbook-session-id': sessionId } }
                )
            } finally {
                try {
                    await graphRequest(
                        'POST',
                        `/sites/${SITE_ID}/drive/items/${fileId}/workbook/closeSession`,
                        null,
                        { headers: { 'workbook-session-id': sessionId } }
                    )
                } catch (err) {
                    console.warn('Failed to close DOF workbook session:', err?.response?.data || err.message)
                }
            }
        }

        res.json({ message: 'DOF billing data saved successfully' })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to save DOF billing data' })
    }
}

export async function saveDofSignatories(req, res) {
    try {
        const { fileId } = req.params
        const { signatories } = req.body

        // Replace {soaNo}/{acctAsst}/{bcuChief} tokens per SOA sheet. The
        // JANITORIAL sheet uses the {accAsst} typo variant, covered by the
        // extra replacement key.
        for (const sheet of DOF_SOA_SHEETS) {
            const sig = signatories[sheet]
            if (!sig) continue

            await replaceDofPlaceholders(fileId, {
                [DOF_PLACEHOLDERS.soaNo]: `SOA NO. ${sig.soaNo}`,
                [DOF_PLACEHOLDERS.acctAsst]: sig.acctAsst.toUpperCase(),
                [DOF_PLACEHOLDERS.acctAsstAlt]: sig.acctAsst.toUpperCase(),
                [DOF_PLACEHOLDERS.bcuChief]: sig.bcuChief.toUpperCase(),
            }, [sheet])
        }

        res.json({ message: 'DOF signatories saved successfully' })

    } catch (err) {
        console.error(err?.response?.data || err)
        res.status(500).json({ message: 'Failed to save DOF signatories' })
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
