import { inject, Injectable } from '@angular/core'
import { Manpower } from './manpower'
import { BillingRate } from '@models/billing-rate'

const FILE_NAME = 'BILLING-TEMPLATE.xlsm'
const TABLE_NAME = 'PositionTable'
const INPUT_COLUMN_MAP = ['posCode', 'posName', 'salaryType', 'salaryWage', 'dailyRate', 'monthlyRate', 'semiMonthlyRate']

@Injectable({
  providedIn: 'root'
})
export class Rates {
  private manpower = inject(Manpower)

  async list(code: string): Promise<BillingRate[]> {
    try {
      const data = await this.manpower.listData(code, FILE_NAME, TABLE_NAME)
      return data.map((item: any) => this.mapRowToRate(item.values))
    } catch (error) {
      throw new Error(`Failed to fetch rates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async get(code: string, index: number): Promise<BillingRate> {
    try {
      const data = await this.manpower.getManpower(code, index, FILE_NAME, TABLE_NAME)
      return this.mapRowToRate(data.data)
    } catch (error) {
      throw new Error(`Failed to fetch rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

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

  async delete(code: string, index: number): Promise<any> {
    try {
      return this.manpower.deleteRow(code, index, FILE_NAME, TABLE_NAME)
    } catch (error) {
      throw new Error(`Failed to delete rate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

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
