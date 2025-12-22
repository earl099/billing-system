import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { User } from '@models/user';
import { Auth } from '@services/auth';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  fb = inject(FormBuilder)
  authService = inject(Auth)
  router = inject(Router)

  form = this.fb.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required]
  })

  loading = false
  error: string | null = null

  async submit() {
    if (this.form.invalid) return
    this.loading = true
    this.error = null
    let userAuth!: Partial<User>
    const { identifier, password } = this.form.value

    if(identifier?.includes('@')) {
      userAuth.email = identifier || undefined
    } else {
      userAuth.username = identifier || undefined
    }
    userAuth.password = password || undefined

    try {
      await this.authService.login(userAuth)
      this.router.navigate(['/dashboard'])
      toast.success('Logged in successfully.')
    } catch (e: any) {
      this.error = 'Error: ' + e?.message || 'Login failed'
    } finally {
      this.loading = false
    }
  }
}
