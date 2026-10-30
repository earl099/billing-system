import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { environment } from '@env/environment.prod'
import { firstValueFrom } from 'rxjs'

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
  billing: BillingRow[]
}

interface SaveTablesPayload {
  billingRows: BillingRow[]
}

interface DepdevCoSetupPayload {
  dateRange: DateRange
  month: string
  year: number
  billingPeriod: string
  soaNo_OMS: string
  soaNo_OVERTIME: string
  acctAsst: string
  bcuChief: string
}

interface DepdevIvaSetupPayload {
  dateRange: DateRange
  month: string
  year: number
  billingPeriod: string
  soaNo_JANITORIAL: string
  soaNo_TRANSPORTATION: string
  soaNo_TS_OVERTIME: string
  acctAsst: string
  bcuChief: string
}

@Injectable({
  providedIn: 'root'
})
export class DepdevBilling {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  async createCoBilling(code: string, payload: CreateBillingPayload): Promise<CreateBillingResponse> {
    return firstValueFrom(
      this.http.post<CreateBillingResponse>(
        `${this.apiUrl}/editor/create/${code}/depdev-co`,
        payload
      )
    )
  }

  async setupCoBilling(fileId: string, payload: DepdevCoSetupPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/depdev-co/${fileId}/setup`,
        payload
      )
    )
  }

  async getCoTables(fileId: string): Promise<GetTablesResponse> {
    return firstValueFrom(
      this.http.get<GetTablesResponse>(
        `${this.apiUrl}/editor/depdev-co/${fileId}/tables`
      )
    )
  }

  async saveCoTables(fileId: string, payload: SaveTablesPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/depdev-co/${fileId}/save`,
        payload
      )
    )
  }

  async createIvaBilling(code: string, payload: CreateBillingPayload): Promise<CreateBillingResponse> {
    return firstValueFrom(
      this.http.post<CreateBillingResponse>(
        `${this.apiUrl}/editor/create/${code}/depdev-iva`,
        payload
      )
    )
  }

  async setupIvaBilling(fileId: string, payload: DepdevIvaSetupPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/depdev-iva/${fileId}/setup`,
        payload
      )
    )
  }

  async getIvaTables(fileId: string): Promise<GetTablesResponse> {
    return firstValueFrom(
      this.http.get<GetTablesResponse>(
        `${this.apiUrl}/editor/depdev-iva/${fileId}/tables`
      )
    )
  }

  async saveIvaTables(fileId: string, payload: SaveTablesPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/depdev-iva/${fileId}/save`,
        payload
      )
    )
  }
}