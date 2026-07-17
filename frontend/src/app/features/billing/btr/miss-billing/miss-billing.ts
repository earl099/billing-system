import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { FileEditor } from '@services/file-editor';
import { BtrBilling } from '@services/btr-billing';
import { DateTime } from 'luxon';
import { toast } from 'ngx-sonner';
import { BillingColumnDef, BillingRow, EditableBillingTable } from '../../ofbank/editable-table/editable-table';

const ITBILLING_COLUMNS: BillingColumnDef[] = [
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
  selector: 'app-miss-billing',
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
  templateUrl: './miss-billing.html',
  styleUrl: './miss-billing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissBilling {
  private fileEditor = inject(FileEditor)
  private btrBilling = inject(BtrBilling)
  private router = inject(Router)

  readonly code = 'btr'

  step = signal<'setup' | 'loading' | 'editing' | 'saving' | 'done'>('setup')
  templates = signal<any[]>([])
  selectedTemplateId = signal<string>('')
  fileId = signal<string | null>(null)
  editUrl = signal<string | null>(null)
  fileName = signal<string>('')

  itBillingData = signal<BillingRow[]>([])
  itBillingColumns = ITBILLING_COLUMNS

  selectedYear = signal<number>(DateTime.now().year)
  selectedMonth = signal<number>(DateTime.now().month)
  selectedPeriod = signal<'first' | 'second'>('first')
  soaNo_MISS = signal<string>('')
  billingPeriod = signal<string>('')
  acctAsst = signal<string>('')
  bcuChief = signal<string>('')

  yearOptions = Array.from({ length: 5 }, (_, i) => DateTime.now().year - 2 + i)
  monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: DateTime.fromObject({ month: i + 1 }).toFormat('MMMM')
  }))

  itTable = viewChild<EditableBillingTable>('itTable')

  dateRange = signal<DateRangeOption>({ label: '', sheetLabel: '' })

  constructor() {
    this.loadTemplates()
    this.updateDateRange()
  }

  private async loadTemplates() {
    try {
      const all = await this.fileEditor.getTemplates(this.code)
      this.templates.set(all.filter((t: any) =>
        t.type === 'excel' && t.name.toUpperCase().includes('BTR-BILLING-MISS-TEMPLATE')
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

    if (!this.soaNo_MISS() || !this.billingPeriod()) {
      toast.error('Please enter the SOA number and billing period for MISS')
      return
    }

    if (!this.acctAsst() || !this.bcuChief()) {
      toast.error('Please enter Account Assistant and BCU Chief')
      return
    }

    this.step.set('loading')

    try {
      const result = await this.btrBilling.createMissBilling(this.code, {
        templateId: this.selectedTemplateId(),
        dateRange: this.dateRange()
      })

      this.fileId.set(result.documentId)
      this.editUrl.set(result.editUrl)
      this.fileName.set(result.fileName)

      await this.btrBilling.setupMissBilling(result.documentId, {
        dateRange: this.dateRange(),
        soaNo_MISS: this.soaNo_MISS(),
        billingPeriod: this.billingPeriod(),
        acctAsst: this.acctAsst().toUpperCase(),
        bcuChief: this.bcuChief().toUpperCase()
      })

      const tables = await this.btrBilling.getMissTables(result.documentId)
      this.itBillingData.set(tables.itBilling)

      this.step.set('editing')
    } catch (e) {
      toast.error('Failed to create billing file')
      this.step.set('setup')
    }
  }

  async saveBilling() {
    const it = this.itTable()
    const id = this.fileId()

    if (!it || !id) {
      toast.error('Something went wrong')
      return
    }

    this.step.set('saving')

    try {
      await this.btrBilling.saveMissTables(id, {
        itBillingRows: it.getEditedRows()
      })

      this.step.set('done')
      toast.success('Billing data saved successfully')
    } catch (e) {
      toast.error('Failed to save billing data')
      this.step.set('editing')
    }
  }

  openInSharePoint() {
    const url = this.editUrl()
    if (url) window.open(url, '_blank')
  }

  goToDashboard() {
    this.router.navigate(['/dashboard'])
  }

  retry() {
    this.step.set('setup')
  }
}
