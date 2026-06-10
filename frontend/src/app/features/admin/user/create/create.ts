import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { UserDTO } from '@models/user';
import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { User } from '@services/user';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-user-create',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatSelectModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './create.html',
  styleUrl: './create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Create implements OnInit {
  clients = signal<any[]>([])

  fb = inject(FormBuilder)
  userService = inject(User)
  clientService = inject(Client)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)

  form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: [<'Admin' | 'User'>'', Validators.required],
    handledClients: [<string[]>[]]
  })

  loading = signal(false)
  error = signal<string | null>(null)

  async ngOnInit() {
    await this.loadClient()
  }

  async loadClient() {
    try {
      const clientList = await this.clientService.list()
      this.clients.set(clientList)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load clients'
      toast.error(errorMessage)
    }
  }

  isAdmin() {
    const role = this.form.get('role')?.value
    const handledClientsControl = this.form.get('handledClients')

    if(role !== 'Admin') {
      const allClient = this.clients().find(c => c.code === 'ALL')
      if(allClient) {
        handledClientsControl?.setValue([allClient._id])
        handledClientsControl?.disable()
      }
    }
    else {
      handledClientsControl?.setValue([])
      handledClientsControl?.enable()
    }
  }

  async submit() {
    if(this.form.invalid) return
    if(!confirm('Are you sure you want to create this User?')) return
    this.loading.set(true)

    try {
      const userObject = this.form.getRawValue() as UserDTO
      await this.userService.create(userObject)

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Created User'
      }

      await this.logService.create(log)
      await this.router.navigate(['/admin/user/list'])
      toast.success('User created successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'User creation failed'
      this.error.set(errorMessage)
      toast.error(`Error: ${errorMessage}`)
    } finally {
      this.loading.set(false)
    }
  }
}
