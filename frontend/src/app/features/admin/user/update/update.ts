/**
 * @fileoverview Admin user update component
 * Loads an existing user by ID, displays editable form with role/client assignment,
 * and updates the user record on submit. Handles Admin role logic for client access.
 * Logs the operation for audit trail.
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
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
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './update.html',
  styleUrl: './update.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Update implements OnInit {
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

  /** Loads user data, client list, and patches the form. Disables client selection for Admin role. */
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) {
      toast.error('Invalid user ID')
      this.router.navigate(['/admin/user/list'])
      return
    }

    this.userId.set(id)

    try {
      const user = await this.userService.get(id)
      if (!user) {
        toast.error('User not found')
        this.router.navigate(['/admin/user/list'])
        return
      }

      const clients = await this.clientService.list()
      this.clientList.set(clients)

      this.form.patchValue({
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        role: user.role ?? 'User',
        handledClients: user.handledClients ?? []
      })

      if(this.form.get('role')?.value === 'Admin') {
        this.form.get('handledClients')?.disable()
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load user'
      toast.error(errorMessage)
      this.router.navigate(['/admin/user/list'])
    }
  }

  /**
   * Handles role change logic for client assignment
   * Non-admin users are auto-assigned to "ALL" client and the field is disabled.
   * Admin users get full client selection control.
   */
  isAdmin() {
    const role = this.form.get('role')?.value
    const handledClientsControl = this.form.get('handledClients')

    if(role !== 'Admin') {
      const allClient = this.clientList().find(c => c.code === 'ALL')
      if(allClient) {
        handledClientsControl?.setValue([allClient._id])
        handledClientsControl?.disable()
      }
    }
    else {
      handledClientsControl?.enable()
      handledClientsControl?.setValue([])
    }
  }

  /** Submits updated user data with confirmation and audit logging. Only includes password if provided. */
  async submit() {
    if(!this.userId()) return
    if(this.form.invalid) return
    if(!confirm('Are you sure you want to update this User?')) return
    this.loading.set(true)

    try {
      const formValue = this.form.getRawValue()
      const payload: Partial<UserDTO> = {
        name: formValue.name ?? undefined,
        username: formValue.username ?? undefined,
        email: formValue.email ?? undefined,
        role: formValue.role ?? undefined,
        handledClients: formValue.handledClients ?? undefined
      }

      if (formValue.password) {
        payload.password = formValue.password
      }

      await this.userService.update(this.userId() ?? '', payload)

      const log: LogDTO = {
        user: this.authService.fetchUser() ?? '',
        operation: 'Updated User'
      }

      await this.logService.create(log)
      await this.router.navigate(['/admin/user/list'])
      toast.success('User updated successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed'
      this.error.set(errorMessage)
      toast.error(`Error: ${errorMessage}`)
    } finally {
      this.loading.set(false)
    }
  }
}
