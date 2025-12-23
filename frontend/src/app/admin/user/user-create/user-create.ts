import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { UserDTO } from '@models/user';
import { User } from '@services/user';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-user-create',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreate {
  clientList = signal<any[]>([])

  fb = inject(FormBuilder)
  userService = inject(User)
  router = inject(Router)

  form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: [<'Admin' | 'User'>'', Validators.required],
    handledClients: [<string[]>[]]
  })

  loading = false
  error: string | null = null

  removeClient(client: string) {
    this.clientList.update(clients => {
      const index = clients.indexOf(client)
      if(index < 0) { return clients }

      clients.splice(index, 1)
      return [...clients]
    })
  }

  addClient(event: MatChipInputEvent) {
    const value = (event.value || '').trim()

    if(value) {
      this.clientList.update(clients => [...clients, value])
    }

    event.chipInput!.clear()
  }

  async submit() {
    if(this.form.invalid) return
    this.loading = true

    try {
      const userObject = this.form.getRawValue() as UserDTO
      await this.userService.create(userObject)
      await this.router.navigate(['/admin/user/list'])
      toast.success('User created successfully')

      //log creation function here

    } catch (err: any) {
      this.error = err?.message ?? 'User creation failed'
      toast.error(this.error ?? err?.message)
    } finally {
      this.loading = false
    }
  }
}
