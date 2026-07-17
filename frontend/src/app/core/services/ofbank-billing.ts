import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
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

interface MonthlySuppliesCreatePayload {
  templateId: string
  month: string
  year: number
}

interface MonthlySuppliesSetupPayload {
  month: string
  year: number
  period1: string
  billingAmount1: number
  period2: string
  billingAmount2: number
  annualRentalFee: number
}

interface MonthlySuppliesCreateResponse {
  documentId: string
  editUrl: string
  fileName: string
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

  async setupBilling(fileId: string, payload: { dateRange: DateRange, soaNo: string }): Promise<any> {
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

  async createMonthlySuppliesBilling(code: string, payload: MonthlySuppliesCreatePayload): Promise<MonthlySuppliesCreateResponse> {
    return firstValueFrom(
      this.http.post<MonthlySuppliesCreateResponse>(
        `${this.apiUrl}/editor/create/${code}/monthly-supplies`,
        payload
      )
    )
  }

  async setupMonthlySuppliesBilling(fileId: string, payload: MonthlySuppliesSetupPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/monthly-supplies/${fileId}/setup`,
        payload
      )
    )
  }
}
