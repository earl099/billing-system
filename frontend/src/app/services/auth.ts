import { inject, Injectable } from '@angular/core';
import { UserAuthDTO, UserDTO } from '@models/user';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private tokenKey = 'app_token'
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)
  router = inject(Router)

  async login(payload: UserAuthDTO) {
    try {
      const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/login`, payload))
      localStorage.setItem(this.tokenKey, res.token)
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
    localStorage.removeItem(this.tokenKey)
    this.router.navigate(['/'])
  }

  token() { return localStorage.getItem(this.tokenKey) }

  async getProfile() {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/auth/me`))
    return res.user
  }

  isAuthenticated() { return !!this.token() }
}
