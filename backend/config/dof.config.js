/**
 * @fileoverview Configuration constants for the DOF billing workflow
 *
 * These values are placeholders until the actual DOF template is uploaded to
 * SharePoint and the exact worksheet names, table names, and cell addresses are
 * confirmed. Update this file once the template is available.
 */

export const DOF_TEMPLATES = {
    billing: 'DOF-BILLING-TEMPLATE.xlsm',
    timekeeping: {
        jan: 'A_JAN-TIMEKEEP-TEMPLATE.xlsx',
        oms: 'B_OMS-TIMEKEEP-TEMPLATE.xlsx',
        man: 'C_MAN-TIMEKEEP-TEMPLATE.xlsx',
    },
}

export const DOF_SOURCE_SHEETS = {
    timekeeping: {
        jan: 'Janitorial Timekeeping',
        oms: 'OMS Timekeeping',
        man: 'MAN Timekeeping',
    },
    billing: {
        jan: '{jBillingSheet}',
        oms: '{oBillingSheet}',
        man: '{mBillingSheet}',
    },
}

export const DOF_SOA_SHEETS = [
    'JANITORIAL',
    'JANITORIAL OVERTIME',
    'OPERATIONS&MAINTENANCE',
    'OPERATIONS&MAINTENANCE OVERTIME',
    'MANPOWER',
    'MANPOWER OVERTIME',
]

export const DOF_TABLES = {
    jan: 'jTimekeep',
    oms: 'oTimekeep',
    man: 'mTimekeep',
}

/**
 * Placeholder tokens inside DOF-BILLING-TEMPLATE.xlsm (verified from the template):
 *   {billingPeriod} - {jBillingSheet}!A4, {oBillingSheet}!A4, {mBillingSheet}!A3, A4 of all 6 SOA sheets
 *   {soaNo}         - G6 of all 6 SOA sheets
 *   {acctAsst}      - SOA sheets (JANITORIAL OVERTIME!B85, O&M!B46, O&M OVERTIME!B50, MANPOWER!B336, MANPOWER OVERTIME!B76)
 *   {accAsst}       - typo variant used only in JANITORIAL!B119
 *   {bcuChief}      - JANITORIAL!E119, JANITORIAL OVERTIME!J85, O&M!D46, O&M OVERTIME!D50, MANPOWER!D336, MANPOWER OVERTIME!D76
 */
export const DOF_PLACEHOLDERS = {
    billingPeriod: '{billingPeriod}',
    soaNo: '{soaNo}',
    acctAsst: '{acctAsst}',
    acctAsstAlt: '{accAsst}',
    bcuChief: '{bcuChief}',
}

/**
 * Per-employee aggregate tables inside the DOF billing file (verified from the template):
 *   jBillingTable - {jBillingSheet}!B7:T59 (19 cols), oBillingTable - {oBillingSheet}!B7:Y22 (24 cols),
 *   mBillingTable - {mBillingSheet}!B6:U163 (20 cols)
 * Rows are matched by employee number (col 0), NOT by row index.
 */
export const DOF_BILLING_TABLES = {
    jan: 'jBillingTable',
    oms: 'oBillingTable',
    man: 'mBillingTable',
}

/**
 * Formula columns in the billing tables that must never be overwritten (verified):
 *   jan: [4] Daily Rate =ROUNDUP(G8/8*24,0), [6] UNDERTIME =((G8/8*24)-(F8))*8*60
 *   oms: [1] EMPLOYEE NAME =PROPER(VLOOKUP(...)), [4] DAILY RATE =E8*12/313
 *   man: no formula columns
 */
export const DOF_BILLING_FORMULA_INDICES = {
    jan: [4, 6],
    oms: [1, 4],
    man: [],
}

/**
 * Formula columns on row 0 of each 16-row block (verified from the templates).
 * Row 0 doubles as the first day row, so it also carries the day-row formulas.
 */
export const DOF_FORMULA_INDICES = {
    jan: [0, 2, 14, 21, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 47, 48, 49, 50, 52],
    oms: [0, 1, 2, 10, 18, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42, 43, 44],
    man: [0, 1, 2, 10, 17, 21, 22, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42],
}

/**
 * Formula columns on every row of the DOF timekeeping tables, including day
 * rows (confirmed from the templates):
 *   jan: col 0 VLOOKUP name, 2 =C2+1 date, 14/21 row OT/ND sums, 43 =AR2*24*60
 *   oms: col 0 VLOOKUP name, 1 =$B2, 2 =C2+1 date, 10/18 row OT/ND sums, 38 =AM2*24*60
 *   man: col 0 VLOOKUP name, 1 VLOOKUP position, 2 =C2+1 date, 10/17 row OT/ND sums, 36 =AK2*24*60
 * Row 0 of each 16-row block additionally has the totals columns covered by DOF_FORMULA_INDICES.
 */
export const DOF_DAY_FORMULA_INDICES = {
    jan: [0, 2, 14, 21, 43],
    oms: [0, 1, 2, 10, 18, 38],
    man: [0, 1, 2, 10, 17, 36],
}
