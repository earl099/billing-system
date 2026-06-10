import { inject, Injectable, signal } from '@angular/core';
import { UserAuthDTO, UserDTO } from '@models/user';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

interface AuthResponse {
  token: string;
  user: { name: string; [key: string]: any };
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private jwtHelper = new JwtHelperService
  private tokenKey = 'app_token'
  private user = 'user'
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)
  private router = inject(Router)
  private watcherTimeout: ReturnType<typeof setTimeout> | null = null
  isLoggedIn = signal<boolean>(this.hasValidToken())

  async login(payload: UserAuthDTO): Promise<AuthResponse> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, payload))
      localStorage.setItem(this.tokenKey, res.token)
      localStorage.setItem(this.user, res.user.name)
      return res
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async signup(payload: UserDTO): Promise<AuthResponse> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.apiUrl}/auth/signup`, payload))
      return res
    } catch (error) {
      throw new Error(`Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async logout() {
    this.clearTokenWatcher()
    localStorage.clear()
    this.router.navigate(['/'])
  }

  token() { return localStorage.getItem(this.tokenKey) }
  fetchUser() { return localStorage.getItem(this.user) }

  async getProfile() {
    try {
      const res = await firstValueFrom(this.http.get<{ user: any }>(`${this.apiUrl}/auth/me`))
      return res.user
    } catch (error) {
      throw new Error(`Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  isTokenExpired(): boolean {
    const token = this.token()
    if(!token) return true

    return this.jwtHelper.isTokenExpired(token)
  }

  hasValidToken(): boolean {
    return !!this.token() && !this.isTokenExpired()
  }

  /**
   * Start watching for token expiration and auto-logout
   * IMPORTANT: Must call clearTokenWatcher() or logout() to prevent memory leaks
   */
  startTokenWatcher() {
    // Clear any existing watcher
    this.clearTokenWatcher()

    const token = this.token()
    if(!token) return

    const exp = this.jwtHelper.getTokenExpirationDate(token)
    if(!exp) return

    const timeout = exp.getTime() - Date.now()

    if(timeout <= 0) {
      this.logout()
      return
    }

    this.watcherTimeout = setTimeout(() => this.logout(), timeout)
  }

  /**
   * Clear the token watcher timeout
   * Call this when component destroys or when logging out
   */
  clearTokenWatcher() {
    if (this.watcherTimeout) {
      clearTimeout(this.watcherTimeout)
      this.watcherTimeout = null
    }
  }

  /**
   * Cleanup when service is destroyed
   */
  ngOnDestroy() {
    this.clearTokenWatcher()
  }
}
