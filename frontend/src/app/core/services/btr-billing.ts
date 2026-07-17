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

interface GetMissTablesResponse {
  itBilling: BillingRow[]
}

interface GetJanitorialTablesResponse {
  jBilling: BillingRow[]
}

interface SaveMissTablesPayload {
  itBillingRows: BillingRow[]
}

interface SaveJanitorialTablesPayload {
  jBillingRows: BillingRow[]
}

interface MissSetupPayload {
  dateRange: DateRange
  soaNo_MISS: string
}

interface JanitorialSetupPayload {
  dateRange: DateRange
  soaNo_JANITORIAL: string
  soaNo_HAULER: string
  soaNo_TFMCD: string
}

interface SupplyRow {
  field: string
  amount: number
}

interface CreateBtrSuppliesPayload {
  templateId: string
  month: string
  year: number
}

interface SetupBtrSuppliesPayload {
  month: string
  year: number
  particulars: string
  billingMonth: string
  period1: string
  period2: string
  mAmount1: number
  mAmount2: number
  sAmount: number
  aaName: string
  bcuChief: string
  supplyRows: SupplyRow[]
}

@Injectable({
  providedIn: 'root'
})
export class BtrBilling {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  async createMissBilling(code: string, payload: CreateBillingPayload): Promise<CreateBillingResponse> {
    return firstValueFrom(
      this.http.post<CreateBillingResponse>(
        `${this.apiUrl}/editor/create/${code}/btr-miss`,
        payload
      )
    )
  }

  async setupMissBilling(fileId: string, payload: MissSetupPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/btr-miss/${fileId}/setup`,
        payload
      )
    )
  }

  async getMissTables(fileId: string): Promise<GetMissTablesResponse> {
    return firstValueFrom(
      this.http.get<GetMissTablesResponse>(
        `${this.apiUrl}/editor/btr-miss/${fileId}/tables`
      )
    )
  }

  async saveMissTables(fileId: string, payload: SaveMissTablesPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/btr-miss/${fileId}/save`,
        payload
      )
    )
  }

  async createJanitorialBilling(code: string, payload: CreateBillingPayload): Promise<CreateBillingResponse> {
    return firstValueFrom(
      this.http.post<CreateBillingResponse>(
        `${this.apiUrl}/editor/create/${code}/btr-janitorial`,
        payload
      )
    )
  }

  async setupJanitorialBilling(fileId: string, payload: JanitorialSetupPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/btr-janitorial/${fileId}/setup`,
        payload
      )
    )
  }

  async getJanitorialTables(fileId: string): Promise<GetJanitorialTablesResponse> {
    return firstValueFrom(
      this.http.get<GetJanitorialTablesResponse>(
        `${this.apiUrl}/editor/btr-janitorial/${fileId}/tables`
      )
    )
  }

  async saveJanitorialTables(fileId: string, payload: SaveJanitorialTablesPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/btr-janitorial/${fileId}/save`,
        payload
      )
    )
  }

  async createBtrSuppliesBilling(code: string, payload: CreateBtrSuppliesPayload): Promise<CreateBillingResponse> {
    return firstValueFrom(
      this.http.post<CreateBillingResponse>(
        `${this.apiUrl}/editor/create/${code}/btr-supplies`,
        payload
      )
    )
  }

  async setupBtrSuppliesBilling(fileId: string, payload: SetupBtrSuppliesPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/btr-supplies/${fileId}/setup`,
        payload
      )
    )
  }
}
