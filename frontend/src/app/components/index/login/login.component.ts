import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { LogsService } from '../../../services/logs.service';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    NgxSonnerToaster
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class LoginComponent {
  signInForm: FormGroup
  authService = inject(AuthService)
  logsService = inject(LogsService)
  router = inject(Router)

  constructor(private fb: FormBuilder) {
    this.signInForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]]
    })
  }

  onLogin(loginData: any) {
    //set token and auth with database
    this.authService.login(loginData.value).subscribe(
      (res) => {
      if(res) {
        toast.success(res.message == null ? '' : res.message)
        if(res.user?.username) {
          this.authService.setToken('user', res.user.username)
        }
        else {
          this.authService.setToken('user', res.user.email)
        }

        this.authService.setToken('userType', res.user.role.toString())
        this.authService.setToken('token', res.accessToken)
        

        const expiration: number = Number(this.authService.getToken('expirationDuration'))

        setTimeout(() => {
          localStorage.clear()
          this.router.navigate(['/dashboard'])
        }, expiration * 1000)
        this.router.navigate(['/dashboard'])

        let logData = {
          operation: 'Logged in Account',
          user: this.authService.getToken('user')
        }
        this.logsService.addLog(logData).subscribe()
      }
      else {
        toast.error('Invalid credentials.')
        localStorage.clear()
        this.signInForm.get('emailOrUser')?.reset('')
        this.signInForm.get('password')?.reset('')
      }
    })
  }

}
