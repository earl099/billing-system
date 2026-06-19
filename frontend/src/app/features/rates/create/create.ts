/**
 * @fileoverview Billing rate creation component
 * Provides a form for creating new billing rate entries in the SharePoint PositionTable.
 * Auto-calculates semi-monthly rate from monthly rate. Logs the operation on success.
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Subscription } from 'rxjs'
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
  selector: 'app-create',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './create.html',
  styleUrl: './create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Create implements OnInit, OnDestroy {
  fb = inject(FormBuilder)
  ratesService = inject(Rates)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)
  route = inject(ActivatedRoute)

  code = this.route.snapshot.paramMap.get('code')

  form = this.fb.group({
    posCode: ['', Validators.required],
    posName: ['', Validators.required],
    salaryWage: [0, [Validators.required, Validators.min(0)]],
    salaryType: ['', Validators.required],
    dailyRate: [0, [Validators.required, Validators.min(0)]],
    monthlyRate: [0, [Validators.required, Validators.min(0)]],
    semiMonthlyRate: [0, [Validators.required, Validators.min(0)]]
  })

  loading = false
  error: string | null = null
  /** Subscription to monthlyRate changes for auto-calculating semiMonthlyRate */
  private monthlyRateSub?: Subscription

  /** Submits the billing rate form, creates the entry, and logs the operation */
  async submit() {
    if(this.form.invalid) return
    this.loading = true

    if(!confirm('Are you sure you want to create this billing rate?')) {
      this.loading = false
      return
    }

    try {
      const payload = this.form.getRawValue() as BillingRate
      await this.ratesService.create(this.code ?? '', payload)
      await this.router.navigate(['/rates', this.code, 'list'])

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Created Billing Rate'
      }

      await this.logService.create(log)
      toast.success('Billing rate created successfully')
    } catch (err: any) {
      this.error = err?.message ?? 'Billing rate creation failed'
      toast.error(this.error ?? 'Billing rate creation failed')
    } finally {
      this.loading = false
    }
  }

  cancel() {
    this.router.navigate(['/rates', this.code, 'list'])
  }

  /** Subscribes to monthlyRate changes to auto-compute semiMonthlyRate = monthlyRate / 2 */
  ngOnInit() {
    this.monthlyRateSub = this.form.get('monthlyRate')!.valueChanges.subscribe(val => {
      this.form.get('semiMonthlyRate')!.setValue(Number(val ?? 0) / 2, { emitEvent: false })
    })
  }

  ngOnDestroy() {
    this.monthlyRateSub?.unsubscribe()
  }
}
