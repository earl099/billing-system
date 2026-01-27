import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { UserDTO } from '@models/user';
import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Log } from '@services/log';
import { User } from '@services/user';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-user-update',
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
export class UserUpdate implements OnInit {
  fb = inject(FormBuilder)
  userService = inject(User)
  clientService = inject(Client)
  authService = inject(Auth)
  logService = inject(Log)
  route = inject(ActivatedRoute)
  router = inject(Router)

  form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: [<'Admin' | 'User'>'', Validators.required],
    handledClients: [<string[]>[], Validators.required],
    password: ['']
  })

  clientList = signal<any[]>([])

  loading = signal(false)
  error = signal<string | null>(null)
  userId = signal<string | null>(null)

  constructor() {

  }

  async ngOnInit() {
    this.userId.set(this.route.snapshot.paramMap.get('id')!)
    if(!this.userId()) return
    const user = signal(await this.userService.get(this.userId() ?? ''))

    const clients = await this.clientService.list()
    this.clientList.set(clients)

    this.form.patchValue({
      name: user().name,
      username: user().username,
      email: user().email,
      role: user().role,
      handledClients: user().handledClients
    })

    if(this.form.get('role')?.value === 'Admin') {
      this.form.get('handledClients')?.disable()
    }
  }

  isAdmin() {
    if(this.form.get('role')?.value !== 'Admin') {
      for (let i = 0; i < this.clientList().length; i++) {
        if(this.clientList()[i].code === 'ALL') {
          this.form.get('handledClients')?.setValue([this.clientList()[i]._id])
          this.form.get('handledClients')?.disable()
        }
      }
    }
    else {
      this.form.get('handledClients')?.enable()
      this.form.get('handledClients')?.setValue([''])
    }
  }

  async submit() {
    if(!this.userId()) return
    if(this.form.invalid) return
    if(!confirm('Are you sure you want to update this User?')) return
    this.loading.set(true)

    try {
      const formValue = this.form.value
      const payload: UserDTO = Object.fromEntries(
        Object.entries(formValue).filter(([_, value]) => value !== null)
      ) as UserDTO
      if(!payload.password) delete payload.password
      await this.userService.update(this.userId() ?? '', payload)
      await this.router.navigate(['/admin/user/list'])
      toast.success('User updated successfully')

      //log function here
      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Updated User'
      }

      await this.logService.create(log)
    } catch (err: any) {
      this.error = err?.message ?? 'Update User failed'
      toast.error('Error: ' + (this.error ?? err?.message))
    } finally {
      this.loading.set(false)
    }
  }
}
