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
  router = inject(Router)

  form = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required]
  })

  loading = false
  error: string | null = null

  async ngOnInit() {
    
  }

  async submit() {
    if(this.form.invalid) return
    this.loading = true
    this.error = null
    let userObject!: UserDTO
    userObject = this.form.getRawValue() as UserDTO

    try {
      await this.authService.signup(userObject)
      this.router.navigate(['/login'])
      toast.success('Signed up successfully')

      //log function to be put here
    } catch (e: any) {
      this.error = 'Error: ' + e?.message || 'Sign up failed'
    } finally {
      this.loading = false
    }
  }
}
