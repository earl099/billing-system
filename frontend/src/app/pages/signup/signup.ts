import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { User } from '@models/user';
import { Auth } from '@services/auth';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-signup',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatSelectModule,
    MatChipsModule,
    RouterLink
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  fb = inject(FormBuilder)
  authService = inject(Auth)
  router = inject(Router)

  form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required],
    role: [<'Admin' | 'User'>'', Validators.required],
    handledClients: [<string[]>[], Validators.required]
  })

  loading = false
  error: string | null = null

  async submit() {
    if(this.form.invalid) return
    this.loading = true
    this.error = null
    let userObject!: User
    userObject = this.form.getRawValue() as User

    try {
      await this.authService.signup(userObject)
      this.router.navigate(['/login'])
      toast.success('Signed up successfully')
    } catch (e: any) {
      this.error = 'Error: ' + e?.message || 'Sign up failed'
    } finally {
      this.loading = false
    }
  }
}
