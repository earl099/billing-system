import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Log } from '@services/log';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgxSonnerToaster,
    RouterLink
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('LBRDC Billing System');
  protected readonly toast = toast
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)
  user = signal<any>({})

  ngOnInit(): void {
    this.user.set(this.authService.getProfile())
  }

  home() {
    if(this.user()) {
      return '/dashboard'
    }
    else {
      return '/'
    }
  }

  async logout() {
    const logObject: LogDTO = {
      user: this.user().name,
      operation: 'Logged Out'
    }

    await this.logService.create(logObject)

    await this.authService.logout()
    toast.success('Logged out successfully')
  }
}
