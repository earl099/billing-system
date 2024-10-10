import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';

import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../../services/auth.service';
import { passwordMatchValidator } from './password-match.validator';
import { LogsService } from '../../../services/logs.service';



@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent implements OnInit {
  signUpForm: FormGroup
  users: any
  private authService = inject(AuthService)
  private logsService = inject(LogsService)
  ngOnInit(): void {

  }

  constructor(private fb: FormBuilder, private toastr: ToastrService, private router: Router) {
    //initialize the signupForm
    this.signUpForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPass: ['', Validators.required],
      userType: ['']
    }, { validators: passwordMatchValidator() })
  }

  onSubmit() {
    if(this.signUpForm.valid) {
      //if there are no users, then set userType to Admin, else set userType to User
      this.authService.getUsers().subscribe((res) => {
        let users = res.users
        let logData
        if(users.length < 1) {
          this.signUpForm.get('userType')?.setValue('Admin')

          logData = {
            operation: 'Add Admin Account',
            user: this.signUpForm.get('username')?.value
          }
          
          this.logsService.addLog(logData).subscribe((res) => {
            if(res) {
              this.authService.signup(this.signUpForm.value).subscribe((res) => {
                if(res) {
                  this.toastr.success(res.message)
                  this.router.navigate(['/login'])
                }
                else {
                  this.toastr.error('Error signing up')
                }
              })
            }
          })

        }
        else {
          this.signUpForm.get('userType')?.setValue('User')

          logData = {
            operation: 'Add User Account',
            user: this.signUpForm.get('username')?.value
          }

          this.logsService.addLog(logData).subscribe((res) => {
            if(res) {
              this.authService.signup(this.signUpForm.value).subscribe((res) => {
                if(res) {
                  this.toastr.success(res.message)
                  this.router.navigate(['/login'])
                }
                else {
                  this.toastr.error('Server error')
                }
              })
            }
          })

        }
      })
    }
    else {
      this.toastr.error('Passwords do not match.')
      this.signUpForm.get('username')?.setValue('')
      this.signUpForm.get('email')?.setValue('')
      this.signUpForm.get('password')?.setValue('')
      this.signUpForm.get('confirmPass')?.setValue('')
    }
  }


}


