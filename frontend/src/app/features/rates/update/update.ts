/**
 * @fileoverview Billing rate update component
 * Loads an existing billing rate by index, displays it in an editable form,
 * and updates the SharePoint PositionTable on submit. Logs the operation for audit trail.
 */

import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { ActivatedRoute, Router } from '@angular/router'
import { MATERIAL_MODULES } from '@material'
import { BillingRate } from '@models/billing-rate'
import { LogDTO } from '@models/log'
import { Auth } from '@services/auth'
import { Log } from '@services/log'
import { Rates } from '@services/rates'
import { toast } from 'ngx-sonner'

@Component({
  selector: 'app-update',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './update.html',
  styleUrl: './update.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Update implements OnInit {
  fb = inject(FormBuilder)
  ratesService = inject(Rates)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)
  route = inject(ActivatedRoute)

  code = this.route.snapshot.paramMap.get('code')
  index = Number(this.route.snapshot.paramMap.get('index'))

  form = this.fb.group({
    posCode: ['', Validators.required],
    posName: [''],
    salaryWage: [0, [Validators.required, Validators.min(0)]],
    salaryType: ['', Validators.required],
    dailyRate: [0, [Validators.required, Validators.min(0)]],
    monthlyRate: [0, [Validators.required, Validators.min(0)]],
    semiMonthlyRate: [0, [Validators.required, Validators.min(0)]]
  })

  loading = false
  error: string | null = null

  /** Loads the existing billing rate data and patches the form values */
  async ngOnInit() {
    const data = await this.ratesService.get(this.code ?? '', this.index)
    this.form.patchValue({
      posCode: data.posCode,
      posName: data.posName,
      salaryWage: data.salaryWage,
      salaryType: data.salaryType,
      dailyRate: data.dailyRate,
      monthlyRate: data.monthlyRate,
      semiMonthlyRate: data.semiMonthlyRate
    })
  }

  /** Submits updated billing rate data, updates the SharePoint row, and logs the operation */
  async submit() {
    if(this.form.invalid) return
    this.loading = true

    if(!confirm('Are you sure you want to update this billing rate?')) {
      this.loading = false
      return
    }

    try {
      const formValue = this.form.getRawValue()
      const payload: BillingRate = Object.fromEntries(
        Object.entries(formValue).filter(([_, value]) => value !== null)
      ) as unknown as BillingRate

      await this.ratesService.update(this.code ?? '', this.index, payload)
      await this.router.navigate(['/rates', this.code, 'list'])

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Updated Billing Rate'
      }

      await this.logService.create(log)
      toast.success('Billing rate updated successfully')
    } catch (err: any) {
      this.error = err?.message ?? 'Billing rate update failed'
      toast.error(this.error ?? 'Billing rate update failed')
    } finally {
      this.loading = false
    }
  }

  cancel() {
    this.router.navigate(['/rates', this.code, 'list'])
  }
}
