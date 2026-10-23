/**
 * @fileoverview Signup component
 * Handles new user registration and initial administrator bootstrap.
 * Redirects already-authenticated users to dashboard.
 */

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { UserDTO } from '@models/user';
import { Auth } from '@services/auth';
import { Client, SignupClientDTO } from '@services/client';
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

  clients = signal<SignupClientDTO[]>([])
  clientSearch = signal('')
  hasAdmin = signal<boolean | null>(null)
  optionsLoading = signal(true)
  optionsFailed = signal(false)

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    handledClients: [[] as string[]],
    bootstrapKey: ['']
  })

  loading = signal(false)
  error = signal<string | null>(null)

  readonly filteredClients = computed(() => {
    const search = this.clientSearch().trim().toLowerCase()
    return this.clients().filter((client) =>
      !search || `${client.code} ${client.name}`.toLowerCase().includes(search)
    )
  })

  /** Redirects authenticated users, otherwise loads the public signup options. */
  async ngOnInit() {
    if (this.authService.hasValidToken()) {
      this.router.navigate(['/dashboard'])
      return
    }
    await this.loadSignupOptions()
  }

  /** Loads the available clients and whether an administrator already exists. */
  async loadSignupOptions() {
    try {
      const options = await this.clientService.signupOptions()
      this.clients.set(options.clients.filter((client) => client.code !== 'ALL' && client.code !== 'NONE'))
      this.hasAdmin.set(options.hasAdmin)

      const handledClientsControl = this.form.controls.handledClients
      if (options.hasAdmin && this.clients().length > 0) {
        handledClientsControl.setValidators([Validators.required])
      } else {
        handledClientsControl.clearValidators()
      }
      handledClientsControl.updateValueAndValidity()

      const bootstrapKeyControl = this.form.controls.bootstrapKey
      if (!options.hasAdmin) {
        bootstrapKeyControl.setValidators([Validators.required])
      } else {
        bootstrapKeyControl.clearValidators()
      }
      bootstrapKeyControl.updateValueAndValidity()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load signup options'
      this.optionsFailed.set(true)
      this.error.set(`Error: ${errorMessage}`)
      toast.error(errorMessage)
    } finally {
      this.optionsLoading.set(false)
    }
  }

  /** Submits registration data and redirects to login after account creation. */
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

  /** Updates the visible client options without changing the selection. */
  updateClientSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.clientSearch.set(event.target.value)
    }
  }

  /** Returns the selected client IDs from the registration form. */
  selectedClientIds(): string[] {
    return this.form.controls.handledClients.value ?? []
  }

  /** Reports whether a client is selected. */
  isClientSelected(clientId: string | undefined): boolean {
    return clientId !== undefined && this.selectedClientIds().includes(clientId)
  }

  /** Applies a checkbox change to the selected client IDs. */
  updateClientSelection(clientId: string | undefined, event: Event): void {
    if (!clientId || !(event.target instanceof HTMLInputElement)) {
      return
    }

    const current = this.selectedClientIds()
    const next = event.target.checked
      ? [...new Set([...current, clientId])]
      : current.filter((id) => id !== clientId)
    this.form.controls.handledClients.setValue(next)
    this.form.controls.handledClients.markAsTouched()
  }

  /** Selects every available client, or clears the current selection. */
  toggleAllClients(): void {
    const allClientIds = this.clients()
      .map((client) => client._id)
      .filter((id): id is string => Boolean(id))
    const hasEveryClient = allClientIds.length > 0 && allClientIds.every((id) => this.selectedClientIds().includes(id))
    this.form.controls.handledClients.setValue(hasEveryClient ? [] : allClientIds)
    this.form.controls.handledClients.markAsTouched()
  }

}
