/**
 * Billing rates service
 * Wraps the Manpower service to provide billing rate-specific operations
 * against the SharePoint PositionTable in the workbook template.
 */

import { inject, Injectable } from '@angular/core'
import { Manpower } from './manpower'
import { BillingRate } from '@models/billing-rate'

/** Default SharePoint workbook filename containing the position rate table */
const DEFAULT_FILE_NAME = 'BILLING-TEMPLATE.xlsm'
/** Excel table name for billing rates */
const TABLE_NAME = 'PositionTable'
/** Column mapping defining the order of fields sent to the backend */
const INPUT_COLUMN_MAP = ['posCode', 'posName', 'salaryType', 'salaryWage', 'dailyRate', 'monthlyRate', 'semiMonthlyRate']

@Injectable({
  providedIn: 'root'
})
export class Rates {
  private manpower = inject(Manpower)

  private resolveFileName(fileName?: string | null): string {
    return fileName && fileName.trim() ? fileName : DEFAULT_FILE_NAME
  }

  /**
   * Lists all billing rates for a client from the SharePoint PositionTable
   */
  async list(code: string, fileName?: string | null): Promise<BillingRate[]> {
    try {
      const data = await this.manpower.listData(code, this.resolveFileName(fileName), TABLE_NAME)
      return data.map((item: any) => this.mapRowToRate(item.values))
    } catch (error) {
      throw new Error(`Failed to fetch rates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Gets a single billing rate by row index
   */
  async get(code: string, index: number, fileName?: string | null): Promise<BillingRate> {
    try {
      const data = await this.manpower.getManpower(code, index, this.resolveFileName(fileName), TABLE_NAME)
      return this.mapRowToRate(data.data)
    } catch (error) {
      throw new Error(`Failed to fetch rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Creates a new billing rate row in the PositionTable
   */
  async create(code: string, payload: BillingRate, fileName?: string | null): Promise<any> {
    try {
      return this.manpower.addToTable(code, this.resolveFileName(fileName), TABLE_NAME, {
        form: payload,
        columnMap: INPUT_COLUMN_MAP
      })
    } catch (error) {
      throw new Error(`Failed to create rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Updates an existing billing rate row in the PositionTable
   */
  async update(code: string, index: number, payload: BillingRate, fileName?: string | null): Promise<any> {
    try {
      return this.manpower.updateRow(code, index, this.resolveFileName(fileName), TABLE_NAME, {
        form: payload,
        columnMap: INPUT_COLUMN_MAP
      })
    } catch (error) {
      throw new Error(`Failed to update rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deletes a billing rate row from the PositionTable
   */
  async delete(code: string, index: number, fileName?: string | null): Promise<any> {
    try {
      return this.manpower.deleteRow(code, index, this.resolveFileName(fileName), TABLE_NAME)
    } catch (error) {
      throw new Error(`Failed to delete rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Maps a raw values array from the SharePoint table row to a BillingRate object
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