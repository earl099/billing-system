import { Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatTabsModule } from '@angular/material/tabs'
import { Router } from '@angular/router'
import { DofBilling, DofBillingDraft } from '@services/dof-billing'
import { DateTime } from 'luxon'
import { toast } from 'ngx-sonner'

interface SignatoryInput {
  soaNo: string
  acctAsst: string
  bcuChief: string
}

const SOA_SHEETS = [
  'JANITORIAL',
  'JANITORIAL OVERTIME',
  'OPERATIONS&MAINTENANCE',
  'OPERATIONS&MAINTENANCE OVERTIME',
  'MANPOWER',
  'MANPOWER OVERTIME',
] as const

@Component({
  selector: 'app-dof-billing',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
  ],
  templateUrl: './dof-billing.html',
  styleUrl: './dof-billing.css',
})
export class DofBillingComponent {
  private dofBilling = inject(DofBilling)
  private router = inject(Router)

  step = signal<'loading' | 'editing' | 'saving' | 'done'>('loading')

  drafts = signal<DofBillingDraft[]>([])
  selectedFileId = signal<string>('')

  readonly sheets = SOA_SHEETS

  signatories = signal<Record<string, SignatoryInput>>(
    Object.fromEntries(SOA_SHEETS.map(sheet => [sheet, { soaNo: '', acctAsst: '', bcuChief: '' }]))
  )

  selectedDraft = computed(() =>
    this.drafts().find(d => d.id === this.selectedFileId()) ?? null
  )

  constructor() {
    this.loadDrafts()
  }

  private async loadDrafts() {
    try {
      const drafts = await this.dofBilling.listBillingDrafts()
      this.drafts.set(drafts)
      this.step.set('editing')
    } catch (e) {
      console.error(e)
      toast.error('Failed to load DOF billing drafts')
      this.step.set('editing')
    }
  }

  formatModified(iso: string): string {
    return DateTime.fromISO(iso).toFormat('MMMM d, yyyy h:mm a')
  }

  updateSignatory(sheet: string, field: keyof SignatoryInput, value: string) {
    this.signatories.update(prev => ({
      ...prev,
      [sheet]: { ...prev[sheet], [field]: value }
    }))
  }

  async saveSignatories() {
    const id = this.selectedFileId()
    if (!id) {
      toast.error('Please select a billing file first')
      return
    }

    const all = this.signatories()
    for (const sheet of SOA_SHEETS) {
      const s = all[sheet]
      if (!s.soaNo || !s.acctAsst || !s.bcuChief) {
        toast.error(`Please complete all signatory fields for ${sheet}`)
        return
      }
    }

    this.step.set('saving')

    try {
      await this.dofBilling.saveSignatories(id, { signatories: all })

      this.step.set('done')
      toast.success('DOF signatories saved successfully')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save signatories')
      this.step.set('editing')
    }
  }

  openInSharePoint() {
    const url = this.selectedDraft()?.webUrl
    if (url) window.open(url, '_blank')
  }

  goToDashboard() {
    this.router.navigate(['/dashboard'])
  }

  editAnother() {
    this.step.set('editing')
    this.selectedFileId.set('')
    this.signatories.set(
      Object.fromEntries(SOA_SHEETS.map(sheet => [sheet, { soaNo: '', acctAsst: '', bcuChief: '' }]))
    )
  }
}
