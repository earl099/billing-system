import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  signInForm: FormGroup
  authService = inject(AuthService)
  router = inject(Router)

  constructor(private fb: FormBuilder, private toastr: ToastrService) {
    this.signInForm = this.fb.group({
      emailOrUser: ['', [Validators.required]],
      password: ['', [Validators.required]]
    })
  }

  onLogin(loginData: any) {
    //set token and auth with database
    this.authService.login(loginData.value).subscribe((res) => {
      if(res) {
        this.toastr.success(res.message)
        if(res.user?.username) {
          this.authService.setToken('user', res.user.username)
        }
        else {
          this.authService.setToken('user', res.user.email)
        }

        this.authService.setToken('userType', res.user.userType)
        this.authService.setToken('token', res.jwToken)
        this.authService.setToken('expirationDuration', res.expirationDuration)

        const expiration: number = Number(this.authService.getToken('expirationDuration'))

        setTimeout(() => {
          localStorage.clear()
          this.router.navigate(['/home'])
        }, expiration * 1000)
        this.router.navigate(['/dashboard'])
      }
      else {
        this.toastr.error('Invalid credentials.')
        localStorage.clear()
        this.signInForm.get('emailOrUser')?.reset('')
        this.signInForm.get('password')?.reset('')
      }
    })
  }

}
