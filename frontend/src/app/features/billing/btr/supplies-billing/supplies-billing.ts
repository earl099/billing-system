import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { BtrBilling } from '@services/btr-billing';
import { FileEditor } from '@services/file-editor';
import { DateTime } from 'luxon';
import { toast } from 'ngx-sonner';

interface SupplyRow {
  field: string
  amount: number
}

@Component({
  selector: 'app-supplies-billing',
  imports: [
    ...MATERIAL_MODULES,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './supplies-billing.html',
  styleUrl: './supplies-billing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliesBilling {
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

  selectedYear = signal<number>(DateTime.now().year)
  selectedMonth = signal<string>(DateTime.now().toFormat('MMMM'))
  particulars = signal<string>('')
  period1 = signal<string>('')
  period2 = signal<string>('')
  mAmount1 = signal<number>(0)
  mAmount2 = signal<number>(0)
  sAmount = signal<number>(0)
  aaName = signal<string>('')
  bcuChief = signal<string>('')
  supplyRows = signal<SupplyRow[]>([])

  yearOptions = Array.from({ length: 5 }, (_, i) => DateTime.now().year - 2 + i)
  monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  billingMonth = computed(() =>
    `FOR THE MONTH OF ${this.selectedMonth().toUpperCase()} ${this.selectedYear()}`
  )

  constructor() {
    this.loadTemplates()
  }

  private async loadTemplates() {
    try {
      const all = await this.fileEditor.getTemplates(this.code)
      this.templates.set(all.filter((t: any) =>
        t.type === 'excel' && t.name.includes('BTR-JANITORIAL,-UTILITY-&-SUPPLIES-TEMPLATE')
      ))
    } catch (e) {
      toast.error('Failed to load templates')
    }
  }

  addRow() {
    this.supplyRows.set([...this.supplyRows(), { field: '', amount: 0 }])
  }

  removeRow(index: number) {
    this.supplyRows.set(this.supplyRows().filter((_, i) => i !== index))
  }

  updateRow(index: number, patch: Partial<SupplyRow>) {
    this.supplyRows.set(
      this.supplyRows().map((row, i) => (i === index ? { ...row, ...patch } : row))
    )
  }

  async createBilling() {
    if (!this.selectedTemplateId()) {
      toast.error('Please select a template')
      return
    }

    this.step.set('loading')

    try {
      const result = await this.btrBilling.createBtrSuppliesBilling(this.code, {
        templateId: this.selectedTemplateId(),
        month: this.selectedMonth(),
        year: this.selectedYear()
      })

      this.fileId.set(result.documentId)
      this.editUrl.set(result.editUrl)
      this.fileName.set(result.fileName)

      this.step.set('editing')
    } catch (e) {
      toast.error('Failed to create billing file')
      this.step.set('setup')
    }
  }

  async saveBilling() {
    const id = this.fileId()

    if (!id) {
      toast.error('Something went wrong')
      return
    }

    if (!this.particulars() || !this.period1() || !this.period2()) {
      toast.error('Please fill in all required fields')
      return
    }

    this.step.set('saving')

    try {
      await this.btrBilling.setupBtrSuppliesBilling(id, {
        month: this.selectedMonth(),
        year: this.selectedYear(),
        particulars: this.particulars(),
        billingMonth: this.billingMonth(),
        period1: this.period1(),
        period2: this.period2(),
        mAmount1: this.mAmount1(),
        mAmount2: this.mAmount2(),
        sAmount: this.sAmount(),
        aaName: this.aaName().toUpperCase(),
        bcuChief: this.bcuChief().toUpperCase(),
        supplyRows: this.supplyRows().filter(r => r.field.trim() !== '')
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
