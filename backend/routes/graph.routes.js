/**
 * @fileoverview Microsoft Graph API routes
 * Defines endpoints for SharePoint/Excel template operations and billing letter generation
 * via the Microsoft Graph API. All routes require authentication.
 */

import { authMiddleware } from "#middleware/auth.middleware.js";
import { clientAccessMiddleware, requireClientCode } from "#middleware/client-access.middleware.js";
import {
    sharepointFileAccessMiddleware,
    sharepointTemplateAccessMiddleware
} from "#middleware/sharepoint-file-access.middleware.js";
import { validateManpowerRequest } from "#middleware/manpower-request.middleware.js";
import {
    addToTable,
    createOfbankBilling,
    createSpadBillingLetter,
    createWordBillingLetter,
    deleteFromTable,
    exportToPdf,
    getFromTable,
    getOfbankTables,
    getTableColumns,
    listData,
    listTemplates,
    saveOfbankTables,
    setupOfbankBilling,
    updateRow,
    createMonthlySuppliesBilling,
    setupMonthlySuppliesBilling,
    createBtrMissBilling,
    setupBtrMissBilling,
    getBtrMissTables,
    saveBtrMissTables,
    createBtrJanitorialBilling,
    setupBtrJanitorialBilling,
    getBtrJanitorialTables,
    saveBtrJanitorialTables,
    createBtrSuppliesBilling,
    setupBtrSuppliesBilling,
    createDofTimekeeping,
    createDofBilling,
    setupDofBilling,
    getDofTables,
    saveDofTables,
    saveDofCategoryTables,
    saveDofSignatories,
    listDofBillingDrafts,
} from "#utils/graphClient.js";
import { Router } from "express";

const graphRouter = Router()

/** Apply auth middleware to all graph routes */
graphRouter.use(authMiddleware)

// BILLING LETTER FUNCTIONS

/** GET /editor/templates/:code - List available templates for a client */
graphRouter.get('/editor/templates/:code', clientAccessMiddleware, listTemplates)
/** POST /editor/create/:code/word - Create Word billing letter from template */
graphRouter.post('/editor/create/:code/word', clientAccessMiddleware, sharepointTemplateAccessMiddleware, createWordBillingLetter)
/** POST /editor/create/:code/excel - Create Excel (SPAD) billing letter from template */
graphRouter.post('/editor/create/:code/excel', clientAccessMiddleware, sharepointTemplateAccessMiddleware, createSpadBillingLetter)
/** GET /editor/export/:id - Export SharePoint document to PDF */
graphRouter.get('/editor/export/:id', sharepointFileAccessMiddleware, exportToPdf)

// MANPOWER/RATES TABLE FUNCTIONS

/** GET /manpower/:code/columns - Get column headers of a SharePoint Excel table */
graphRouter.get('/manpower/:code/columns', clientAccessMiddleware, validateManpowerRequest, getTableColumns)
/** GET /manpower/:code/list - List all rows from a SharePoint Excel table */
graphRouter.get('/manpower/:code/list', clientAccessMiddleware, validateManpowerRequest, listData)
/** GET /manpower/:code/:index - Get single row by index from table */
graphRouter.get('/manpower/:code/:index', clientAccessMiddleware, validateManpowerRequest, getFromTable)
/** POST /manpower/:code/add - Add new row to table */
graphRouter.post('/manpower/:code/add', clientAccessMiddleware, validateManpowerRequest, addToTable)
/** PATCH /manpower/:code/:index/edit - Update row at index in table */
graphRouter.patch('/manpower/:code/:index/edit', clientAccessMiddleware, validateManpowerRequest, updateRow)
/** DELETE /manpower/:code/:index/delete - Delete row at index from table */
graphRouter.delete('/manpower/:code/:index/delete', clientAccessMiddleware, validateManpowerRequest, deleteFromTable)

// OFBANK MANPOWER BILLING

/** POST /editor/create/:code/ofbank - Copy OFBANK billing template and rename file */
graphRouter.post('/editor/create/:code/ofbank', clientAccessMiddleware, sharepointTemplateAccessMiddleware, createOfbankBilling)
/** PATCH /editor/ofbank/:fileId/setup - Rename worksheets and fill date range cells */
graphRouter.patch('/editor/ofbank/:fileId/setup', sharepointFileAccessMiddleware, setupOfbankBilling)
/** GET /editor/ofbank/:fileId/tables - Read jBillingTable and oBillingTable from created file */
graphRouter.get('/editor/ofbank/:fileId/tables', sharepointFileAccessMiddleware, getOfbankTables)
/** PATCH /editor/ofbank/:fileId/save - Save edited billing data back to both tables */
graphRouter.patch('/editor/ofbank/:fileId/save', sharepointFileAccessMiddleware, saveOfbankTables)

// OFBANK MONTHLY SUPPLIES BILLING

/** POST /editor/create/:code/monthly-supplies - Copy monthly supplies template and rename file */
graphRouter.post('/editor/create/:code/monthly-supplies', clientAccessMiddleware, sharepointTemplateAccessMiddleware, createMonthlySuppliesBilling)
/** PATCH /editor/monthly-supplies/:fileId/setup - Fill monthly supplies billing cells */
graphRouter.patch('/editor/monthly-supplies/:fileId/setup', sharepointFileAccessMiddleware, setupMonthlySuppliesBilling)

// BTR MISS BILLING

/** POST /editor/create/:code/btr-miss - Copy BTr MISS billing template */
graphRouter.post('/editor/create/:code/btr-miss', clientAccessMiddleware, sharepointTemplateAccessMiddleware, createBtrMissBilling)
/** PATCH /editor/btr-miss/:fileId/setup - Setup BTr MISS billing cells */
graphRouter.patch('/editor/btr-miss/:fileId/setup', sharepointFileAccessMiddleware, setupBtrMissBilling)
/** GET /editor/btr-miss/:fileId/tables - Read itBillingTable from BTr MISS file */
graphRouter.get('/editor/btr-miss/:fileId/tables', sharepointFileAccessMiddleware, getBtrMissTables)
/** PATCH /editor/btr-miss/:fileId/save - Save edited itBillingTable data */
graphRouter.patch('/editor/btr-miss/:fileId/save', sharepointFileAccessMiddleware, saveBtrMissTables)

// BTR JANITORIAL BILLING

/** POST /editor/create/:code/btr-janitorial - Copy BTr Janitorial billing template */
graphRouter.post('/editor/create/:code/btr-janitorial', clientAccessMiddleware, sharepointTemplateAccessMiddleware, createBtrJanitorialBilling)
/** PATCH /editor/btr-janitorial/:fileId/setup - Setup BTr Janitorial billing cells */
graphRouter.patch('/editor/btr-janitorial/:fileId/setup', sharepointFileAccessMiddleware, setupBtrJanitorialBilling)
/** GET /editor/btr-janitorial/:fileId/tables - Read jBillingTable from BTr Janitorial file */
graphRouter.get('/editor/btr-janitorial/:fileId/tables', sharepointFileAccessMiddleware, getBtrJanitorialTables)
/** PATCH /editor/btr-janitorial/:fileId/save - Save edited jBillingTable data */
graphRouter.patch('/editor/btr-janitorial/:fileId/save', sharepointFileAccessMiddleware, saveBtrJanitorialTables)

// BTR SUPPLIES BILLING

/** POST /editor/create/:code/btr-supplies - Copy BTr supplies billing template */
graphRouter.post('/editor/create/:code/btr-supplies', clientAccessMiddleware, sharepointTemplateAccessMiddleware, createBtrSuppliesBilling)
/** PATCH /editor/btr-supplies/:fileId/setup - Fill BTr supplies billing cells and insert rows */
graphRouter.patch('/editor/btr-supplies/:fileId/setup', sharepointFileAccessMiddleware, setupBtrSuppliesBilling)

// DOF BILLING

/** POST /editor/create/:code/dof/timekeeping - Create three DOF timekeeping files (JAN, OMS, MAN) */
graphRouter.post('/editor/create/:code/dof/timekeeping', clientAccessMiddleware, createDofTimekeeping)
/** POST /editor/create/:code/dof/billing - Copy DOF billing template and rename file */
graphRouter.post('/editor/create/:code/dof/billing', clientAccessMiddleware, createDofBilling)
/** PATCH /editor/dof/:timekeepingId/:billingId/setup - Rename worksheets and fill period cells in billing and timekeeping files */
graphRouter.patch('/editor/dof/:timekeepingId/:billingId/setup', sharepointFileAccessMiddleware, setupDofBilling)
/** GET /editor/dof/drafts - List DOF billing draft files, newest first */
graphRouter.get('/editor/dof/drafts', requireClientCode('DOF'), listDofBillingDrafts)
/** GET /editor/dof/:fileId/tables - Read jTimekeep/oTimekeep/mTimekeep plus the billing file's jBilling/oBilling/mBilling tables */
graphRouter.get('/editor/dof/:fileId/tables', sharepointFileAccessMiddleware, getDofTables)
/** PATCH /editor/dof/:fileId/tables - Save timekeeper data to the three timekeeping files and the billing file */
graphRouter.patch('/editor/dof/:fileId/tables', sharepointFileAccessMiddleware, saveDofTables)
/** PATCH /editor/dof/:fileId/tables/:category - Save one DOF category (jan/oms/man) to its timekeeping file and the billing file for that billing period */
graphRouter.patch('/editor/dof/:fileId/tables/:category', sharepointFileAccessMiddleware, saveDofCategoryTables)
/** PATCH /editor/dof/:fileId/signatories - Save SOA number and signatory cells */
graphRouter.patch('/editor/dof/:fileId/signatories', sharepointFileAccessMiddleware, saveDofSignatories)

export default graphRouter
