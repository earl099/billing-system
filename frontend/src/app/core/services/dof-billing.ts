import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { environment } from '@env/environment.prod'
import { firstValueFrom } from 'rxjs'
import { BillingRow } from '@billing/ofbank/editable-table/editable-table'

export interface DateRange {
  label: string
  sheetLabel: string
}

export interface DofTimekeepingFiles {
  jan: { documentId: string; editUrl: string; fileName: string }
  oms: { documentId: string; editUrl: string; fileName: string }
  man: { documentId: string; editUrl: string; fileName: string }
}

interface CreateTimekeepingPayload {
  dateRange: DateRange
  year: number
  month: string
  billingPeriod: string
}

interface CreateBillingPayload {
  dateRange: DateRange
}

interface CreateResponse {
  documentId: string
  editUrl: string
  fileName: string
}

interface SetupPayload {
  dateRange: DateRange
  timekeepingFiles: { jan: string; oms: string; man: string }
  year: number
  month: string
  billingPeriod: string
}

interface GetTablesResponse {
  jan: BillingRow[]
  oms: BillingRow[]
  man: BillingRow[]
  janBilling: BillingRow[]
  omsBilling: BillingRow[]
  manBilling: BillingRow[]
}

export interface DofTableRow {
  index: number
  values: any[]
  type: 'block' | 'day'
}

export interface DofBillingTableRow {
  index: number
  values: any[]
}

export interface DofBillingDraft {
  id: string
  name: string
  lastModifiedDateTime: string
  webUrl: string
}

interface SaveTablesPayload {
  janRows: DofTableRow[]
  omsRows: DofTableRow[]
  manRows: DofTableRow[]
  janBillingRows: DofBillingTableRow[]
  omsBillingRows: DofBillingTableRow[]
  manBillingRows: DofBillingTableRow[]
  timekeepingFiles: { jan: string; oms: string; man: string }
}

interface SignatoryInput {
  soaNo: string
  acctAsst: string
  bcuChief: string
}

interface SaveSignatoriesPayload {
  signatories: Record<string, SignatoryInput>
}

@Injectable({
  providedIn: 'root'
})
export class DofBilling {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  async createTimekeeping(code: string, payload: CreateTimekeepingPayload): Promise<DofTimekeepingFiles> {
    return firstValueFrom(
      this.http.post<DofTimekeepingFiles>(
        `${this.apiUrl}/editor/create/${code}/dof/timekeeping`,
        payload
      )
    )
  }

  async createBilling(code: string, payload: CreateBillingPayload): Promise<CreateResponse> {
    return firstValueFrom(
      this.http.post<CreateResponse>(
        `${this.apiUrl}/editor/create/${code}/dof/billing`,
        payload
      )
    )
  }

  async setupBilling(timekeepingId: string | null, billingId: string, payload: SetupPayload): Promise<any> {
    const tkId = timekeepingId ?? 'null'
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/dof/${tkId}/${billingId}/setup`,
        payload
      )
    )
  }

  async getTables(billingFileId: string, timekeepingFiles: { jan: string; oms: string; man: string }): Promise<GetTablesResponse> {
    return firstValueFrom(
      this.http.get<GetTablesResponse>(
        `${this.apiUrl}/editor/dof/${billingFileId}/tables`,
        { params: { janId: timekeepingFiles.jan, omsId: timekeepingFiles.oms, manId: timekeepingFiles.man } }
      )
    )
  }

  async saveTables(fileId: string, payload: SaveTablesPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/dof/${fileId}/tables`,
        payload
      )
    )
  }

  async saveSignatories(fileId: string, payload: SaveSignatoriesPayload): Promise<any> {
    return firstValueFrom(
      this.http.patch<any>(
        `${this.apiUrl}/editor/dof/${fileId}/signatories`,
        payload
      )
    )
  }

  async listBillingDrafts(): Promise<DofBillingDraft[]> {
    return firstValueFrom(
      this.http.get<DofBillingDraft[]>(`${this.apiUrl}/editor/dof/drafts`)
    )
  }
}
