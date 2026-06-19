/**
 * @fileoverview Root application component
 * Serves as the shell component containing the navigation bar, toast notifications,
 * and router outlet. Manages user session state, token expiration watching,
 * and logout with audit logging.
 */

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
  /** Current authenticated user profile, null if not logged in */
  user = signal<any>(null)

  /** Starts token expiration watcher and loads user profile if already authenticated */
  ngOnInit(): void {
    if (this.authService.hasValidToken()) {
      this.authService.startTokenWatcher()
      this.loadProfile()
    }
  }

  /** Cleans up token watcher timeout to prevent memory leaks */
  ngOnDestroy(): void {
    this.authService.clearTokenWatcher()
  }

  /** Fetches the current user's profile from the API */
  private async loadProfile() {
    try {
      const profile = await this.authService.getProfile()
      this.user.set(profile)
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  /**
   * Returns the appropriate home route based on authentication state
   * @returns '/dashboard' if logged in, '/' if not
   */
  home() {
    if(this.user()) {
      return '/dashboard'
    }
    else {
      return '/'
    }
  }

  /** Logs the logout operation, clears the session, and redirects to home */
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
