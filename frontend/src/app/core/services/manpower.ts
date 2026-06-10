import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

interface ManpowerListResponse {
  list: any[];
}

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

  async listData(code: string, fileName: string, tableName: string): Promise<any[]> {
    try {
      const res = await firstValueFrom(this.http.get<ManpowerListResponse>(`${this.apiUrl}/manpower/${code}/list?fileName=${fileName}&tableName=${tableName}`))
      return res.list
    } catch (error) {
      throw new Error(`Failed to fetch manpower list: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

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
