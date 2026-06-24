import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { FileEditor } from '@services/file-editor';
import { OfbankBilling } from '@services/ofbank-billing';
import { DateTime } from 'luxon';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-monthly-supplies-billing',
  imports: [
    ...MATERIAL_MODULES,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './monthly-supplies-billing.html',
  styleUrl: './monthly-supplies-billing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlySuppliesBilling {
  private fileEditor = inject(FileEditor)
  private ofbankBilling = inject(OfbankBilling)
  private router = inject(Router)

  readonly code = 'ofbank'

  step = signal<'setup' | 'loading' | 'editing' | 'saving' | 'done'>('setup')
  templates = signal<any[]>([])
  selectedTemplateId = signal<string>('')
  fileId = signal<string | null>(null)
  editUrl = signal<string | null>(null)
  fileName = signal<string>('')

  selectedYear = signal<number>(DateTime.now().year)
  selectedMonth = signal<string>(DateTime.now().toFormat('MMMM'))

  yearOptions = Array.from({ length: 5 }, (_, i) => DateTime.now().year - 2 + i)
  monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  period1 = signal<string>('')
  billingAmount1 = signal<number>(0)
  period2 = signal<string>('')
  billingAmount2 = signal<number>(0)
  annualRentalFee = signal<number>(0)

  constructor() {
    this.loadTemplates()
  }

  private async loadTemplates() {
    try {
      const all = await this.fileEditor.getTemplates(this.code)
      this.templates.set(all.filter((t: any) =>
        t.type === 'excel' && t.name.includes('MONTHLY-SUPPLIES-BILLING-TEMPLATE')
      ))
    } catch (e) {
      toast.error('Failed to load templates')
    }
  }

  async createBilling() {
    if (!this.selectedTemplateId()) {
      toast.error('Please select a template')
      return
    }

    this.step.set('loading')

    try {
      const result = await this.ofbankBilling.createMonthlySuppliesBilling(this.code, {
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

    if (!this.period1() || !this.period2()) {
      toast.error('Please fill in both periods')
      return
    }

    if (this.billingAmount1() <= 0 || this.billingAmount2() <= 0) {
      toast.error('Please enter valid billing amounts')
      return
    }

    if (this.annualRentalFee() <= 0) {
      toast.error('Please enter a valid annual rental fee')
      return
    }

    this.step.set('saving')

    try {
      await this.ofbankBilling.setupMonthlySuppliesBilling(id, {
        month: this.selectedMonth(),
        year: this.selectedYear(),
        period1: this.period1(),
        billingAmount1: this.billingAmount1(),
        period2: this.period2(),
        billingAmount2: this.billingAmount2(),
        annualRentalFee: this.annualRentalFee()
      })

      this.step.set('done')
      toast.success('Monthly supplies billing saved successfully')
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
