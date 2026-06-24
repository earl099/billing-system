/**
 * @fileoverview Microsoft Graph API routes
 * Defines endpoints for SharePoint/Excel template operations and billing letter generation
 * via the Microsoft Graph API. All routes require authentication.
 */

import { authMiddleware } from "#middleware/auth.middleware.js";
import {
    addToTable,
    createOfbankBilling,
    createSpadBillingLetter,
    createWordBillingLetter,
    deleteFromTable,
    exportToPdf,
    getFromTable,
    getOfbankTables,
    listData,
    listTemplates,
    saveOfbankTables,
    setupOfbankBilling,
    updateRow,
    createMonthlySuppliesBilling,
    setupMonthlySuppliesBilling
} from "#utils/graphClient.js";
import { Router } from "express";

const graphRouter = Router()

/** Apply auth middleware to all graph routes */
graphRouter.use(authMiddleware)

// BILLING LETTER FUNCTIONS

/** GET /editor/templates/:code - List available templates for a client */
graphRouter.get('/editor/templates/:code', listTemplates)
/** POST /editor/create/:code/word - Create Word billing letter from template */
graphRouter.post('/editor/create/:code/word', createWordBillingLetter)
/** POST /editor/create/:code/excel - Create Excel (SPAD) billing letter from template */
graphRouter.post('/editor/create/:code/excel', createSpadBillingLetter)
/** GET /editor/export/:id - Export SharePoint document to PDF */
graphRouter.get('/editor/export/:id', exportToPdf)

// MANPOWER/RATES TABLE FUNCTIONS

/** GET /manpower/:code/list - List all rows from a SharePoint Excel table */
graphRouter.get('/manpower/:code/list', listData)
/** GET /manpower/:code/:index - Get single row by index from table */
graphRouter.get('/manpower/:code/:index', getFromTable)
/** POST /manpower/:code/add - Add new row to table */
graphRouter.post('/manpower/:code/add', addToTable)
/** PATCH /manpower/:code/:index/edit - Update row at index in table */
graphRouter.patch('/manpower/:code/:index/edit', updateRow)
/** DELETE /manpower/:code/:index/delete - Delete row at index from table */
graphRouter.delete('/manpower/:code/:index/delete', deleteFromTable)

// OFBANK MANPOWER BILLING

/** POST /editor/create/:code/ofbank - Copy OFBANK billing template and rename file */
graphRouter.post('/editor/create/:code/ofbank', createOfbankBilling)
/** PATCH /editor/ofbank/:fileId/setup - Rename worksheets and fill date range cells */
graphRouter.patch('/editor/ofbank/:fileId/setup', setupOfbankBilling)
/** GET /editor/ofbank/:fileId/tables - Read jBillingTable and oBillingTable from created file */
graphRouter.get('/editor/ofbank/:fileId/tables', getOfbankTables)
/** PATCH /editor/ofbank/:fileId/save - Save edited billing data back to both tables */
graphRouter.patch('/editor/ofbank/:fileId/save', saveOfbankTables)

// OFBANK MONTHLY SUPPLIES BILLING

/** POST /editor/create/:code/monthly-supplies - Copy monthly supplies template and rename file */
graphRouter.post('/editor/create/:code/monthly-supplies', createMonthlySuppliesBilling)
/** PATCH /editor/monthly-supplies/:fileId/setup - Fill monthly supplies billing cells */
graphRouter.patch('/editor/monthly-supplies/:fileId/setup', setupMonthlySuppliesBilling)

export default graphRouter
