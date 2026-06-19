/**
 * Authentication service
 * Handles user login, signup, logout, JWT token management, and auto-logout on expiration
 */

import { inject, Injectable, signal } from '@angular/core';
import { UserAuthDTO, UserDTO } from '@models/user';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

/** Response shape from authentication endpoints */
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
  /** localStorage key for JWT token */
  private tokenKey = 'app_token'
  /** localStorage key for username */
  private user = 'user'
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)
  private router = inject(Router)
  /** Timer reference for auto-logout on token expiration */
  private watcherTimeout: ReturnType<typeof setTimeout> | null = null

  /** Reactive signal indicating whether the user has a valid, non-expired token */
  isLoggedIn = signal<boolean>(this.hasValidToken())

  /**
   * Authenticates a user with username/email and password
   * Stores JWT token and username in localStorage on success
   * 
   * @param payload - Login credentials (identifier + password)
   * @returns Auth response containing JWT token and user info
   */
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

  /**
   * Registers a new user account
   * 
   * @param payload - User registration data
   * @returns Auth response containing JWT token and user info
   */
  async signup(payload: UserDTO): Promise<AuthResponse> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.apiUrl}/auth/signup`, payload))
      return res
    } catch (error) {
      throw new Error(`Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Logs out the current user
   * Clears token watcher, removes all localStorage data, and redirects to login
   */
  async logout() {
    this.clearTokenWatcher()
    localStorage.clear()
    this.router.navigate(['/'])
  }

  /** @returns The stored JWT token string, or null if not logged in */
  token() { return localStorage.getItem(this.tokenKey) }

  /** @returns The stored username string, or null if not logged in */
  fetchUser() { return localStorage.getItem(this.user) }

  /**
   * Fetches the current authenticated user's profile from the server
   * 
   * @returns User profile data (without password)
   */
  async getProfile() {
    try {
      const res = await firstValueFrom(this.http.get<{ user: any }>(`${this.apiUrl}/auth/me`))
      return res.user
    } catch (error) {
      throw new Error(`Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Checks if the stored JWT token has expired
   * 
   * @returns true if token is missing or expired, false if still valid
   */
  isTokenExpired(): boolean {
    const token = this.token()
    if(!token) return true

    return this.jwtHelper.isTokenExpired(token)
  }

  /**
   * Checks if the user has a valid, non-expired token
   * 
   * @returns true if a token exists and has not expired
   */
  hasValidToken(): boolean {
    return !!this.token() && !this.isTokenExpired()
  }

  /**
   * Starts a timer that auto-logs out the user when their JWT token expires
   * Reads the expiration date from the token and schedules logout accordingly.
   * 
   * IMPORTANT: Must call clearTokenWatcher() or logout() to prevent memory leaks
   */
  startTokenWatcher() {
    // Clear any existing watcher to avoid duplicate timers
    this.clearTokenWatcher()

    const token = this.token()
    if(!token) return

    const exp = this.jwtHelper.getTokenExpirationDate(token)
    if(!exp) return

    const timeout = exp.getTime() - Date.now()

    // If already expired, logout immediately
    if(timeout <= 0) {
      this.logout()
      return
    }

    this.watcherTimeout = setTimeout(() => this.logout(), timeout)
  }

  /**
   * Clears the token expiration watcher timeout
   * Should be called when a component is destroyed or when logging out
   */
  clearTokenWatcher() {
    if (this.watcherTimeout) {
      clearTimeout(this.watcherTimeout)
      this.watcherTimeout = null
    }
  }

  /** Cleanup when service is destroyed */
  ngOnDestroy() {
    this.clearTokenWatcher()
  }
}
