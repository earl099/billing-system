import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { ClientDTO } from '@models/client';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
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
  error = signal<string | null>(null)
  clientId = signal<string | null>(null)

  async ngOnInit() {
    this.clientId.set(this.route.snapshot.paramMap.get('id')!)
    if(!this.clientId()) return
    const client = signal(await this.clientService.get(this.clientId() ?? ''))

    const payFreqs = await this.payFreqService.list()
    this.payFreqList.set(payFreqs)

    this.form.patchValue({
      code: client().code,
      name: client().name,
      payFreq: client().payFreq
    })
  }

  async submit() {
    if(!this.clientId()) return
    if(this.form.invalid) return
    if(!confirm('Are you sure you want to update this client?')) return
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
      this.error = err?.message ?? 'Update Client failed'
      toast.error('Error: ' + (this.error ?? err?.message))
    } finally {
      this.loading.set(false)
    }
  }
}
