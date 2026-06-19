/**
 * @fileoverview Signup component
 * Handles new user registration with name, username, email, and password.
 * Redirects already-authenticated users to dashboard.
 * Logs successful signup operations for audit trail.
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { UserDTO } from '@models/user';
import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { Payfreq } from '@services/payfreq';
import { User } from '@services/user';
import { Log } from '@services/log';
import { LogDTO } from '@models/log';
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
export class Signup implements OnInit {
  users = signal<any[]>([])
  payFreqs = signal<any[]>([])
  clients = signal<any[]>([])

  fb = inject(FormBuilder)
  userService = inject(User)
  payFreqService = inject(Payfreq)
  clientService = inject(Client)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)

  form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required]
  })

  loading = false
  error: string | null = null

  /** Redirects to dashboard if user already has a valid token */
  async ngOnInit() {
    if (this.authService.hasValidToken()) {
      this.router.navigate(['/dashboard'])
    }
  }

  /** Submits registration data, creates the account, and redirects to login */
  async submit() {
    if(this.form.invalid) return
    this.loading = true
    this.error = null

    const userObject = this.form.getRawValue() as UserDTO

    try {
      await this.authService.signup(userObject)

      const logObject: LogDTO = {
        operation: 'Signed Up'
      }

      await this.logService.create(logObject)

      this.router.navigate(['/login'])
      toast.success('Signed up successfully')
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Sign up failed'
      this.error = `Error: ${errorMessage}`
      toast.error(this.error)
    } finally {
      this.loading = false
    }
  }
}
