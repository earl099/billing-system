import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { ClientDTO } from '@models/client';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { Payfreq } from '@services/payfreq';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-client-create',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './create.html',
  styleUrl: './create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Create implements OnInit {
  payFreqs = signal<any[]>([])

  fb = inject(FormBuilder)
  clientService = inject(Client)
  payFreqService = inject(Payfreq)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)

  form = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    payFreq: ['', Validators.required]
  })

  loading = false
  error: string | null = null

  async ngOnInit() {
    await this.loadPayFreqs()
  }

  async loadPayFreqs() {
    const payFreqList = await this.payFreqService.list()
    this.payFreqs.set(payFreqList)
  }

  async submit() {
    if(this.form.invalid) return
    this.loading = true

    if(!confirm('Are you sure you want to create this Client?')) return

    try {
      const clientObject = this.form.getRawValue() as ClientDTO
      await this.clientService.create(clientObject)
      await this.router.navigate(['/admin/client/list'])

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Created Client'
      }

      await this.logService.create(log)
    } catch (err: any) {
      this.error = err?.message ?? 'Client creation failed'
      toast.error(this.error ?? err?.message)
    } finally {
      this.loading = false
    }
  }
}
