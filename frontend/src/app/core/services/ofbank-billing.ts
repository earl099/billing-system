import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

interface DateRange {
  label: string
  sheetLabel: string
}

interface CreateBillingPayload {
  templateId: string
  dateRange: DateRange
}

interface CreateBillingResponse {
  documentId: string
  editUrl: string
  fileName: string
}

interface BillingRow {
  index: number
  values: any[]
}

interface GetTablesResponse {
  jBilling: BillingRow[]
  oBilling: BillingRow[]
}

interface SaveTablesPayload {
  jBillingRows: BillingRow[]
  oBillingRows: BillingRow[]
}

@Injectable({
  providedIn: 'root'
})
export class OfbankBilling {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  async createBilling(code: string, payload: CreateBillingPayload): Promise<CreateBillingResponse> {
    return firstValueFrom(
      this.http.post<CreateBillingResponse>(
        `${this.apiUrl}/editor/create/${code}/ofbank`,
        payload
      )
    )
  }

  async setupBilling(fileId: string, payload: { dateRange: DateRange }): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/ofbank/${fileId}/setup`,
        payload
      )
    )
  }

  async getTables(fileId: string): Promise<GetTablesResponse> {
    return firstValueFrom(
      this.http.get<GetTablesResponse>(
        `${this.apiUrl}/editor/ofbank/${fileId}/tables`
      )
    )
  }

  async saveTables(fileId: string, payload: SaveTablesPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/ofbank/${fileId}/save`,
        payload
      )
    )
  }
}
