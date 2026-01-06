import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { PayFreqDTO } from '@models/payfreq';
import { Auth } from '@services/auth';
import { Log } from '@services/log';
import { Payfreq } from '@services/payfreq';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-payfreq-create',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './payfreq-create.html',
  styleUrl: './payfreq-create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayfreqCreate {
  fb = inject(FormBuilder)
  payFreqService = inject(Payfreq)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)

  form = this.fb.group({ payType: ['', Validators.required] })

  loading = false
  error: string | null = null

  async submit() {
    if(this.form.invalid) return
    this.loading = true

    if(!confirm('Are you sure you want to create this Pay Frequency?')) return
    try {
      const payFreq = this.form.getRawValue() as PayFreqDTO
      await this.payFreqService.create(payFreq)
      await this.router.navigate(['/admin/payfreq/list'])
      toast.success('Pay Frequency creation successful')

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Created Pay Frequency'
      }

      await this.logService.create(log)
    } catch (err: any) {
      this.error = err.message ?? 'Pay Frequency creation failed'
      toast.error(this.error ?? err?.message)
    } finally {
      this.loading = false
    }
  }
}
