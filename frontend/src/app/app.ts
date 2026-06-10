import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
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
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('LBRDC Billing System');
  protected readonly toast = toast
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)
  user = signal<any>(null)

  ngOnInit(): void {
    // Start token watcher only if user has valid token
    if (this.authService.hasValidToken()) {
      this.authService.startTokenWatcher()
      this.loadProfile()
    }
  }

  ngOnDestroy(): void {
    // Clean up token watcher to prevent memory leaks
    this.authService.clearTokenWatcher()
  }

  private async loadProfile() {
    try {
      const profile = await this.authService.getProfile()
      this.user.set(profile)
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
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
    try {
      const logObject: LogDTO = {
        operation: 'Logged Out'
      }
      await this.logService.create(logObject)

      await this.authService.logout()
      toast.success('Logged out successfully')
    } catch (error) {
      console.log(error)
    }
  }
}
