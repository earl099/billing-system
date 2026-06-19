/**
 * Billing rates service
 * Wraps the Manpower service to provide billing rate-specific operations
 * against the SharePoint PositionTable in the BILLING-TEMPLATE.xlsm workbook
 */

import { inject, Injectable } from '@angular/core'
import { Manpower } from './manpower'
import { BillingRate } from '@models/billing-rate'

/** SharePoint workbook filename containing the position rate table */
const FILE_NAME = 'BILLING-TEMPLATE.xlsm'
/** Excel table name for billing rates */
const TABLE_NAME = 'PositionTable'
/** Column mapping defining the order of fields sent to the backend */
const INPUT_COLUMN_MAP = ['posCode', 'posName', 'salaryType', 'salaryWage', 'dailyRate', 'monthlyRate', 'semiMonthlyRate']

@Injectable({
  providedIn: 'root'
})
export class Rates {
  private manpower = inject(Manpower)

  /**
   * Lists all billing rates for a client from the SharePoint PositionTable
   * 
   * @param code - Client code for the template folder
   * @returns Array of BillingRate objects mapped from table row values
   */
  async list(code: string): Promise<BillingRate[]> {
    try {
      const data = await this.manpower.listData(code, FILE_NAME, TABLE_NAME)
      return data.map((item: any) => this.mapRowToRate(item.values))
    } catch (error) {
      throw new Error(`Failed to fetch rates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Gets a single billing rate by row index
   * 
   * @param code - Client code for the template folder
   * @param index - Row index in the PositionTable
   * @returns BillingRate object mapped from the row values
   */
  async get(code: string, index: number): Promise<BillingRate> {
    try {
      const data = await this.manpower.getManpower(code, index, FILE_NAME, TABLE_NAME)
      return this.mapRowToRate(data.data)
    } catch (error) {
      throw new Error(`Failed to fetch rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Creates a new billing rate row in the PositionTable
   * Passes the form payload object directly; the backend maps it via INPUT_COLUMN_MAP
   * 
   * @param code - Client code for the template folder
   * @param payload - BillingRate data to add
   * @returns Response with the added row data
   */
  async create(code: string, payload: BillingRate): Promise<any> {
    try {
      return this.manpower.addToTable(code, FILE_NAME, TABLE_NAME, {
        form: payload,
        columnMap: INPUT_COLUMN_MAP
      })
    } catch (error) {
      throw new Error(`Failed to create rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Updates an existing billing rate row in the PositionTable
   * 
   * @param code - Client code for the template folder
   * @param index - Row index to update
   * @param payload - Updated BillingRate data
   * @returns Response with the updated row data
   */
  async update(code: string, index: number, payload: BillingRate): Promise<any> {
    try {
      return this.manpower.updateRow(code, index, FILE_NAME, TABLE_NAME, {
        form: payload,
        columnMap: INPUT_COLUMN_MAP
      })
    } catch (error) {
      throw new Error(`Failed to update rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deletes a billing rate row from the PositionTable
   * 
   * @param code - Client code for the template folder
   * @param index - Row index to delete
   * @returns Deletion confirmation response
   */
  async delete(code: string, index: number): Promise<any> {
    try {
      return this.manpower.deleteRow(code, index, FILE_NAME, TABLE_NAME)
    } catch (error) {
      throw new Error(`Failed to delete rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Maps a raw values array from the SharePoint table row to a BillingRate object
   * Array indices correspond to INPUT_COLUMN_MAP order
   * 
   * @param values - Raw array of cell values from the Excel table row
   * @returns Mapped BillingRate object
   */
  private mapRowToRate(values: any[]): BillingRate {
    return {
      posCode: values[0],
      posName: values[1],
      salaryType: values[2],
      salaryWage: values[3],
      dailyRate: values[4],
      monthlyRate: values[5],
      semiMonthlyRate: values[6]
    }
  }
}
