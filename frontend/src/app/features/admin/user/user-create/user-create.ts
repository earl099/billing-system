import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
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
    RouterLink
  ],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreate implements OnInit{
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
    handledClients: [<string[] | null>[]]
  })

  loading = false
  error: string | null = null

  async ngOnInit() {
    await this.loadClient()
  }

  async loadClient() {
    const clientList = await this.clientService.list()
    this.clients.set(clientList)
  }

  isAdmin() {
    if(this.form.get('role')?.value !== 'Admin') {
      for (let i = 0; i < this.clients().length; i++) {
        if(this.clients()[i].code === 'ALL') {
          this.form.get('handledClients')?.setValue([this.clients()[i]._id])
          this.form.get('handledClients')?.disable()
          break
        }
      }
    }
    else {
      this.form.get('handledClients')?.setValue([])
      this.form.get('handledClients')?.enable()
    }
  }

  async submit() {
    if(this.form.invalid) return
    this.loading = true

    if(!confirm('Are you sure you want to create this User?')) return
    try {
      const userObject = this.form.getRawValue() as UserDTO
      await this.userService.create(userObject)
      await this.router.navigate(['/admin/user/list'])
      toast.success('User created successfully')

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Created User'
      }

      await this.logService.create(log)
    } catch (err: any) {
      this.error = err?.message ?? 'User creation failed'
      toast.error(this.error ?? err?.message)
    } finally {
      this.loading = false
    }
  }
}
