import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { UserAuthDTO, UserDTO } from '@models/user';
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

  async submit() {
    if (this.form.invalid) return
    this.loading = true
    this.error = null
    let userAuth: UserAuthDTO

    const { identifier, password } = this.form.value
    userAuth = { identifier: identifier!, password: password! }

    try {
      const user = await this.authService.login(userAuth)
      this.router.navigate(['/dashboard'])
      toast.success('Logged in successfully.')

      //log function to be put here
      const logObject: LogDTO = {
        user: user.user.name,
        operation: 'Logged Out'
      }

      await this.logService.create(logObject)
    } catch (e: any) {
      this.error = 'Error: ' + e?.message || 'Login failed'
    } finally {
      this.loading = false
    }
  }
}
