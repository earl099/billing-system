import { inject, Injectable, signal } from '@angular/core';
import { UserAuthDTO, UserDTO } from '@models/user';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

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
  isLoggedIn = signal<boolean>(this.hasValidToken())

  async login(payload: UserAuthDTO) {
    try {
      const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/login`, payload))
      localStorage.setItem(this.tokenKey, res.token)
      localStorage.setItem(this.user, res.user.name)
      return res
    } catch (error) {
      console.log(error)
    }

  }

  async signup(payload: UserDTO) {
    const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/signup`, payload))
    return res
  }

  async logout() {
    localStorage.clear()
    this.router.navigate(['/'])
  }

  token() { return localStorage.getItem(this.tokenKey) }
  fetchUser() { return localStorage.getItem(this.user) }

  async getProfile() {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/auth/me`))
    return res.user
  }

  isTokenExpired(): boolean {
    const token = this.token()
    if(!token) return true

    return this.jwtHelper.isTokenExpired(token)
  }

  hasValidToken(): boolean {
    return !!this.token() && !this.isTokenExpired()
  }

  startTokenWatcher() {
    const token = this.token()
    if(!token) return

    const exp = this.jwtHelper.getTokenExpirationDate(token)
    if(!exp) return

    const timeout = exp.getTime() - Date.now()

    if(timeout <= 0) {
      this.logout()
      return
    }

    setTimeout(() => this.logout(), timeout)
  }
}
