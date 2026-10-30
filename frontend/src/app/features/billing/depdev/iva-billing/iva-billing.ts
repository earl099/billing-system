import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { FileEditor } from '@services/file-editor';
import { DepdevBilling } from '@services/depdev-billing';
import { DateTime } from 'luxon';
import { toast } from 'ngx-sonner';
import { BillingColumnDef, BillingRow, EditableBillingTable } from '../../ofbank/editable-table/editable-table';

const BILLING_COLUMNS: BillingColumnDef[] = [
  { key: 'no', label: 'No.', type: 'readonly', index: 0 },
  { key: 'empNo', label: 'Employee No.', type: 'readonly', index: 1 },
  { key: 'empName', label: 'Employee Name', type: 'readonly', index: 2 },
  { key: 'position', label: 'Position', type: 'readonly', index: 3 },
  { key: 'monthlyRate', label: 'Monthly Rate', type: 'readonly', index: 4 },
  { key: 'dailyRate', label: 'Daily Rate', type: 'hidden', index: 5 },
  { key: 'hoursRendered', label: 'Hours Rendered', type: 'hidden', index: 6 },
  { key: 'undertime', label: 'Undertime', type: 'time', index: 7 },
  { key: 'legalHolidayOT', label: 'Legal Holiday OT (100%)', type: 'time', index: 8 },
  { key: 'regularOT', label: 'Regular OT', type: 'time', index: 9 },
  { key: 'restDayOT', label: 'Rest Day OT', type: 'time', index: 10 },
  { key: 'specialHolidayOTRestDay', label: 'Special Holiday OT in Rest Day', type: 'time', index: 11 },
  { key: 'restDayOTExcess', label: 'Rest Day OT Excess', type: 'time', index: 12 },
  { key: 'specialHolidayOT', label: 'Special Holiday OT', type: 'time', index: 13 },
  { key: 'specialHolidayOTExcess', label: 'Special Holiday OT Excess', type: 'time', index: 14 },
  { key: 'legalHolidayOT2', label: 'Legal Holiday OT (200%)', type: 'time', index: 15 },
  { key: 'legalHolidayOTExcess', label: 'Legal Holiday OT Excess', type: 'time', index: 16 },
  { key: 'nightDiff', label: 'Night Differential', type: 'time', index: 17 },
  { key: 'nightDiffOT', label: 'Night Diff OT', type: 'time', index: 18 },
  { key: 'nightDiffRestDayOT', label: 'Night Diff Rest Day OT', type: 'time', index: 19 },
  { key: 'nightDiffLegalHolidayOT', label: 'Night Diff Legal Holiday OT', type: 'time', index: 20 },
  { key: 'remarks', label: 'Remarks', type: 'text', index: 21 },
]

interface DateRangeOption {
  label: string
  sheetLabel: string
}

@Component({
  selector: 'app-iva-billing',
  imports: [
    ...MATERIAL_MODULES,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    EditableBillingTable,
  ],
  templateUrl: './iva-billing.html',
  styleUrl: './iva-billing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IvaBilling {
  private fileEditor = inject(FileEditor)
  private depdevBilling = inject(DepdevBilling)
  private router = inject(Router)

  readonly code = 'depdev'

  step = signal<'setup' | 'loading' | 'editing' | 'saving' | 'done'>('setup')
  templates = signal<any[]>([])
  selectedTemplateId = signal<string>('')
  fileId = signal<string | null>(null)
  editUrl = signal<string | null>(null)
  fileName = signal<string>('')

  billingData = signal<BillingRow[]>([])
  billingColumns = BILLING_COLUMNS

  selectedYear = signal<number>(DateTime.now().year)
  selectedMonth = signal<number>(DateTime.now().month)
  selectedPeriod = signal<'first' | 'second'>('first')
  billingPeriod = signal<string>('')
  soaNo_JANITORIAL = signal<string>('')
  soaNo_TRANSPORTATION = signal<string>('')
  soaNo_TS_OVERTIME = signal<string>('')
  acctAsst = signal<string>('')
  bcuChief = signal<string>('')

  yearOptions = Array.from({ length: 5 }, (_, i) => DateTime.now().year - 2 + i)
  monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: DateTime.fromObject({ month: i + 1 }).toFormat('MMMM')
  }))

  billingTable = viewChild<EditableBillingTable>('billingTable')

  dateRange = signal<DateRangeOption>({ label: '', sheetLabel: '' })

  constructor() {
    this.loadTemplates()
    this.updateDateRange()
  }

  private async loadTemplates() {
    try {
      const all = await this.fileEditor.getTemplates(this.code)
      this.templates.set(all.filter((t: any) =>
        t.type === 'excel' && t.name.toUpperCase().includes('DEPDEV-IV-A-BILLING-TEMPLATE')
      ))
    } catch (e) {
      toast.error('Failed to load templates')
    }
  }

  updateDateRange() {
    const dt = DateTime.fromObject({ year: this.selectedYear(), month: this.selectedMonth() })
    const monthFull = dt.toFormat('MMMM')
    const daysInMonth = dt.daysInMonth!

    let label: string
    let sheetLabel: string

    if (this.selectedPeriod() === 'first') {
      label = `${monthFull} 1-15, ${dt.year}`
      sheetLabel = `${monthFull} 1-15`
    } else {
      label = `${monthFull} 16-${daysInMonth}, ${dt.year}`
      sheetLabel = `${monthFull} 16-${daysInMonth}`
    }

    this.dateRange.set({ label, sheetLabel })
  }

  async createBilling() {
    if (!this.selectedTemplateId()) {
      toast.error('Please select a template')
      return
    }

    if (!this.billingPeriod()) {
      toast.error('Please enter the billing period')
      return
    }

    if (!this.soaNo_JANITORIAL() || !this.soaNo_TRANSPORTATION() || !this.soaNo_TS_OVERTIME()) {
      toast.error('Please enter all SOA numbers')
      return
    }

    if (!this.acctAsst() || !this.bcuChief()) {
      toast.error('Please enter Account Assistant and BCU Chief')
      return
    }

    this.step.set('loading')

    try {
      const result = await this.depdevBilling.createIvaBilling(this.code, {
        templateId: this.selectedTemplateId(),
        dateRange: this.dateRange()
      })

      this.fileId.set(result.documentId)
      this.editUrl.set(result.editUrl)
      this.fileName.set(result.fileName)

      await this.depdevBilling.setupIvaBilling(result.documentId, {
        dateRange: this.dateRange(),
        month: DateTime.fromObject({ month: this.selectedMonth() }).toFormat('MMMM'),
        year: this.selectedYear(),
        billingPeriod: this.billingPeriod(),
        soaNo_JANITORIAL: this.soaNo_JANITORIAL(),
        soaNo_TRANSPORTATION: this.soaNo_TRANSPORTATION(),
        soaNo_TS_OVERTIME: this.soaNo_TS_OVERTIME(),
        acctAsst: this.acctAsst().toUpperCase(),
        bcuChief: this.bcuChief().toUpperCase()
      })

      const tables = await this.depdevBilling.getIvaTables(result.documentId)
      this.billingData.set(tables.billing)

      this.step.set('editing')
    } catch (e) {
      toast.error('Failed to create billing file')
      this.step.set('setup')
    }
  }

  async saveBilling() {
    const t = this.billingTable()
    const id = this.fileId()

    if (!t || !id) {
      toast.error('Something went wrong')
      return
    }

    const rows = t.getEditedRows()

    for (const row of rows) {
      const values = row.values ?? []
      const regularOt = this.toHours(values[9])
      const restDayOt = this.toHours(values[10])
      if (regularOt > 5) {
        toast.error('Regular overtime exceeds the 5-hour maximum')
        return
      }
      if (restDayOt > 12) {
        toast.error('Rest day overtime exceeds the 12-hour maximum')
        return
      }
    }

    this.step.set('saving')

    try {
      await this.depdevBilling.saveIvaTables(id, {
        billingRows: rows
      })

      this.step.set('done')
      toast.success('Billing data saved successfully')
    } catch (e) {
      toast.error('Failed to save billing data')
      this.step.set('editing')
    }
  }

  private toHours(val: any): number {
    if (val == null || val === '') return 0
    if (typeof val === 'number') return val
    const s = String(val).trim()
    const m = s.match(/^(\d{1,2}):(\d{2})$/)
    if (m) return parseInt(m[1], 10) + parseInt(m[2], 10) / 60
    const n = parseFloat(s)
    return isNaN(n) ? 0 : n
  }

  openInSharePoint() {
    const url = this.editUrl()
    if (url) window.open(url, '_blank')
  }

  goToDashboard() {
    this.router.navigate(['/dashboard'])
  }

  goToDepdev() {
    this.router.navigate(['/dashboard'])
  }

  retry() {
    this.step.set('setup')
  }
}