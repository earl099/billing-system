/**
 * @fileoverview Signup component
 * Handles new user registration with name, username, email, and password.
 * Redirects already-authenticated users to dashboard.
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { ClientDTO } from '@models/client';
import { UserDTO } from '@models/user';
import { Auth } from '@services/auth';
import { Client } from '@services/client';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-signup',
  imports: [
    ...MATERIAL_MODULES,
    ReactiveFormsModule,
    MatSelectModule,
    RouterLink
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup implements OnInit {
  fb = inject(FormBuilder)
  authService = inject(Auth)
  clientService = inject(Client)
  router = inject(Router)

  clients = signal<ClientDTO[]>([])

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    handledClients: [<string[]>[]]
  })

  loading = signal(false)
  error = signal<string | null>(null)

  /** Redirects to dashboard if user already has a valid token, otherwise loads selectable clients */
  async ngOnInit() {
    if (this.authService.hasValidToken()) {
      this.router.navigate(['/dashboard'])
      return
    }
    await this.loadClients()
  }

  /**
   * Fetches the public client list for the handled-clients selector.
   * System placeholder clients (ALL/NONE) are excluded. The field is
   * only required when selectable clients exist; an empty database
   * means this is the first (Admin) signup, which gets ALL automatically.
   */
  async loadClients() {
    try {
      const clientList = await this.clientService.allList()
      const selectable = clientList.filter(c => c.code !== 'ALL' && c.code !== 'NONE')
      this.clients.set(selectable)

      const handledClientsControl = this.form.get('handledClients')
      if (selectable.length > 0) {
        handledClientsControl?.setValidators([Validators.required])
      } else {
        handledClientsControl?.clearValidators()
      }
      handledClientsControl?.updateValueAndValidity()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load clients'
      toast.error(errorMessage)
    }
  }

  /** Submits registration data, creates the account, and redirects to login */
  async submit() {
    if (this.form.invalid) return
    this.loading.set(true)
    this.error.set(null)

    const userObject = this.form.getRawValue() as UserDTO

    try {
      await this.authService.signup(userObject)
      this.router.navigate(['/login'])
      toast.success('Signed up successfully')
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Sign up failed'
      this.error.set(`Error: ${errorMessage}`)
      toast.error(errorMessage)
    } finally {
      this.loading.set(false)
    }
  }
}
