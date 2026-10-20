/**
 * @fileoverview Admin client update component
 * Loads an existing client by ID, displays it in an editable form with pay frequency selection,
 * and updates the client record on submit. Logs the operation for audit trail.
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { ClientDTO } from '@models/client';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Confirmation } from '@services/confirmation';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { Payfreq } from '@services/payfreq';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-client-update',
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
  confirmation = inject(Confirmation)
  payFreqList = signal<any[]>([])

  fb = inject(FormBuilder)
  clientService = inject(Client)
  payFreqService = inject(Payfreq)
  authService = inject(Auth)
  logService = inject(Log)
  route = inject(ActivatedRoute)
  router = inject(Router)

  form = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    payFreq: [<string[]>[], Validators.required]
  })

  loading = signal(false)
  initializing = signal(true)
  error = signal<string | null>(null)
  clientId = signal<string | null>(null)

  /** Loads client data and pay frequency options, then patches the form */
  async ngOnInit() {
    this.clientId.set(this.route.snapshot.paramMap.get('id')!)
    if(!this.clientId()) {
      this.initializing.set(false)
      return
    }
    try {
      const [client, payFreqs] = await Promise.all([this.clientService.get(this.clientId() ?? ''), this.payFreqService.list()])
      this.payFreqList.set(payFreqs)
      this.form.patchValue({ code: client.code, name: client.name, payFreq: Array.isArray(client.payFreq) ? client.payFreq : [] })
    } finally { this.initializing.set(false) }
  }

  /** Submits updated client data with confirmation and audit logging */
  async submit() {
    if(!this.clientId()) return
    if(this.form.invalid) return
    if(!(await this.confirmation.confirm('Are you sure you want to update this client?'))) return
    this.loading.set(true)

    try {
      const formValue = this.form.value
      const payload: ClientDTO = Object.fromEntries(
        Object.entries(formValue).filter(([_, value]) => value !== null)
      ) as unknown as ClientDTO

      await this.clientService.update(this.clientId() ?? '', payload)
      await this.router.navigate(['/admin/client/list'])
      toast.success('Client updated successfully')

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Updated Client'
      }

      await this.logService.create(log)
    } catch (err: any) {
      this.error.set(err?.message ?? 'Update Client failed')
      toast.error('Error: ' + (this.error() ?? err?.message))
    } finally {
      this.loading.set(false)
    }
  }
}
