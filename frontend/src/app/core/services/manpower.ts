/**
 * Manpower service
 * Handles SharePoint Excel table operations via Microsoft Graph API,
 * including listing, reading, adding, updating, and deleting rows in workbook tables
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
import { firstValueFrom } from 'rxjs';

/** Response shape from list endpoint */
interface ManpowerListResponse {
  list: any[];
}

/** Response shape from single row endpoint */
interface ManpowerResponse {
  data: any;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class Manpower {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  /**
   * Lists all rows from a SharePoint Excel table
   * 
   * @param code - Client code for the template folder
   * @param fileName - Excel workbook filename (e.g., 'BILLING-TEMPLATE.xlsm')
   * @param tableName - Table name within the workbook (e.g., 'EmployeeTable', 'PositionTable')
   * @returns Array of row objects with index and values
   */
  async listData(code: string, fileName: string, tableName: string): Promise<any[]> {
    try {
      const res = await firstValueFrom(this.http.get<ManpowerListResponse>(`${this.apiUrl}/manpower/${code}/list?fileName=${fileName}&tableName=${tableName}`))
      return res.list
    } catch (error) {
      throw new Error(`Failed to fetch manpower list: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Gets a single row from a SharePoint Excel table by index
   * 
   * @param code - Client code for the template folder
   * @param index - Row index in the table
   * @param fileName - Excel workbook filename
   * @param tableName - Table name within the workbook
   * @returns Row data with index and values array
   */
  async getManpower(
    code: string,
    index: number,
    fileName: string,
    tableName: string
  ): Promise<ManpowerResponse> {
    try {
      const res = await firstValueFrom(this.http.get<ManpowerResponse>(`${this.apiUrl}/manpower/${code}/${index}?fileName=${fileName}&tableName=${tableName}`))
      return res
    } catch (error) {
      throw new Error(`Failed to fetch manpower: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Adds a new row to a SharePoint Excel table
   * Data is mapped to columns via the columnMap array on the backend
   * 
   * @param code - Client code for the template folder
   * @param fileName - Excel workbook filename
   * @param tableName - Table name within the workbook
   * @param data - Object containing form data and columnMap for row mapping
   * @returns Response with the added row data
   */
  async addToTable(
    code: string,
    fileName: string,
    tableName: string,
    data: any
  ): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(
          `${this.apiUrl}/manpower/${code}/add?fileName=${fileName}&tableName=${tableName}`,
          data
        )
      )
      return res
    } catch (error) {
      throw new Error(`Failed to add to table: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Updates an existing row in a SharePoint Excel table by index
   * Creates a workbook session for consistent updates with formula recalculation
   * 
   * @param code - Client code for the template folder
   * @param index - Row index to update
   * @param fileName - Excel workbook filename
   * @param tableName - Table name within the workbook
   * @param payload - Object containing form data and columnMap for row mapping
   * @returns Response with the updated row data
   */
  async updateRow(
    code: string,
    index: number,
    fileName: string,
    tableName: string,
    payload: any
  ): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.patch<any>(
        `${this.apiUrl}/manpower/${code}/${index}/edit?fileName=${fileName}&tableName=${tableName}`,
        payload
      ))
      return res
    } catch (error) {
      throw new Error(`Failed to update row: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deletes a row from a SharePoint Excel table by index
   * Creates a workbook session for consistent deletion with formula recalculation
   * 
   * @param code - Client code for the template folder
   * @param index - Row index to delete
   * @param fileName - Excel workbook filename
   * @param tableName - Table name within the workbook
   * @returns Deletion confirmation response
   */
  async deleteRow(
    code: string,
    index: number,
    fileName: string,
    tableName: string
  ): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.delete<any>(
        `${this.apiUrl}/manpower/${code}/${index}/delete?fileName=${fileName}&tableName=${tableName}`
      ))
      return res
    } catch (error) {
      throw new Error(`Failed to delete row: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
