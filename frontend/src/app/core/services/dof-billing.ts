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
  jan: DofCreatedFile
  oms: DofCreatedFile
  man: DofCreatedFile
}

interface DofCreatedFile {
  documentId: string
  editUrl: string
  fileName: string
  /** False when an existing draft for the billing period was reused. */
  created?: boolean
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

type CreateResponse = DofCreatedFile

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
  /**
   * Set when the employee had no row in the template's billing table. The backend
   * appends these via rows/add so their hours are not lost, flagged for review.
   */
  unmatched?: boolean
}

export interface DofBillingDraft {
  id: string
  name: string
  lastModifiedDateTime: string
  webUrl: string
}

export type DofCategory = 'jan' | 'oms' | 'man'

interface SaveTablesPayload {
  janRows: DofTableRow[]
  omsRows: DofTableRow[]
  manRows: DofTableRow[]
  janBillingRows: DofBillingTableRow[]
  omsBillingRows: DofBillingTableRow[]
  manBillingRows: DofBillingTableRow[]
  timekeepingFiles: { jan: string; oms: string; man: string }
  /**
   * When true the backend compares each row against the workbook's current values
   * and skips rows that already match, instead of rewriting every row. Opt-in and
   * off by default; the backend reads the live table state rather than trusting a
   * client-side snapshot, so it stays correct after a failed save.
   */
  diffWrite?: boolean
}

/**
 * Payload for saving a single DOF category (jan, oms or man).
 * The backend resolves the billing file that owns the payload's
 * billing period - reusing the current one when the periods
 * match, otherwise the newest draft for that period or a newly
 * generated billing file - and writes the category's billing
 * aggregates there.
 */
interface DofCategorySavePayload {
  rows: DofTableRow[]
  billingRows: DofBillingTableRow[]
  timekeepingFileId: string
  code: string
  dateRange: DateRange
  year: number
  month: string
  billingPeriod: string
  diffWrite?: boolean
}

interface DofCategorySaveResponse {
  message: string
  /** The billing file the category's aggregates were written to. */
  billingFile?: { documentId: string; editUrl: string; fileName: string }
  /** True when the save generated a new billing file for the period. */
  billingFileCreated?: boolean
  unmatchedRowsAdded?: number
  skippedRows?: number
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

  /**
   * Saves one DOF category (jan, oms or man): its timekeeping rows
   * to the category's timekeeping workbook and its billing
   * aggregates to the billing file that owns the payload's billing
   * period.
   */
  async saveCategoryTables(
    billingFileId: string,
    category: DofCategory,
    payload: DofCategorySavePayload
  ): Promise<DofCategorySaveResponse> {
    return firstValueFrom(
      this.http.patch<DofCategorySaveResponse>(
        `${this.apiUrl}/editor/dof/${billingFileId}/tables/${category}`,
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
