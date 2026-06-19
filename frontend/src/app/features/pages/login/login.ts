/**
 * @fileoverview Login component
 * Handles user authentication with username/email and password.
 * Redirects already-authenticated users to dashboard.
 * Logs successful login operations for audit trail.
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { UserAuthDTO } from '@models/user';
import { Auth } from '@services/auth';
import { Log } from '@services/log';
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
  logService = inject(Log)
  router = inject(Router)

  form = this.fb.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required]
  })

  loading = false
  error: string | null = null

  /** Redirects to dashboard if user already has a valid token */
  ngOnInit() {
    if (this.authService.hasValidToken()) {
      this.router.navigate(['/dashboard'])
    }
  }

  /** Submits login credentials, stores JWT token, and logs the operation */
  async submit() {
    if (this.form.invalid) return
    this.loading = true
    this.error = null

    const { identifier, password } = this.form.value
    if (!identifier || !password) {
      this.error = 'Please fill in all fields'
      this.loading = false
      return
    }

    const userAuth: UserAuthDTO = { identifier, password }

    try {
      await this.authService.login(userAuth)

      const logObject: LogDTO = {
        operation: 'Logged In'
      }

      await this.logService.create(logObject)

      this.router.navigate(['/dashboard'])
      toast.success('Logged in successfully.')
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Login failed'
      this.error = `Error: ${errorMessage}`
      toast.error(this.error)
    } finally {
      this.loading = false
    }
  }
}
