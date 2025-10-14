import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { UserService } from './user.service';
import { RegisterData, AuthResponse, Credentials, LoginResponse } from '@models/auth';
import { User } from '../models/user';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private userService = inject(UserService)
  private baseUrl = 'http://localhost:3000/api'
  //private baseUrl = 'https://billing-system-dolz.onrender.com/api';
  
  private isAuthenticatedSignal = signal<boolean>(false)

  readonly isAuthenticated = computed(() => this.isAuthenticatedSignal())

  env = environment

  #tokenSignal = signal<string | null>(null)
  token = this.#tokenSignal.asReadonly()

  redirectUrl!: string;
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  err = 'An error occurred.';
  

  constructor() {
    untracked(() => {
      this.initializeTokens()
    })

    effect(() => {
      const token = this.#tokenSignal()
      const user = this.userService.user()

      if(token) {
        localStorage.setItem('accessToken', token)
      }
      else {
        localStorage.removeItem('accessToken')
      }

      if(user) {
        localStorage.setItem('userInfo', JSON.stringify(user))
      }
      else {
        localStorage.removeItem('userInfo')
      }
    })
  }

  

  //** SIGN UP FUNCTION **//
  signup(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/user/signup`, userData).pipe(
      tap(() => console.log('Registering user, please wait...')),
      catchError((error) => { return throwError(() => error) }),
      tap((response) => {
        this.#tokenSignal.set(response.accessToken)
        this.userService.setUser(response.user)
        this.router.navigate(['/'])
      })
    )
  }

  //** LOGIN FUNCTION **//
  login(credentials: Credentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.env.apiUrl}/user/login`, credentials).pipe(
      tap(() => console.log('Logging in...')),
      catchError((error) => { return throwError(() => error) }),
      tap((response) => {
        this.#tokenSignal.set(response.accessToken)
        this.isAuthenticatedSignal.set(true)
        this.userService.setUser(response.user)
        this.router.navigate(['/dashboard'])
      })
    )
  }

  //** LOGOUT FUNCTION **//
  logout(): Observable<void | object> {
    return this.http.post(`${this.baseUrl}/user/logout`, null).pipe(
      tap(() => console.log('Signing out user...')),
      catchError((error) => { return throwError(() => error) }),
      tap(() => {
        this.#tokenSignal.set(null)
        this.isAuthenticatedSignal.set(false)
        this.userService.clearUser()
      })
    )
  }

  //** TOKEN FUNCTIONS **//
  //set new token
  setToken(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  //get token
  getToken(key: string) {
    return localStorage.getItem(key);
  }

  //delete token
  deleteToken() {
    localStorage.clear();
  }

  isLoggedIn(): boolean {
    if(this.#tokenSignal() != null) {
      return true
    }
    else {
      return false
    }
  }

  public isLoggedInSub = new BehaviorSubject<boolean>(false);
  public isLoggedInBehaviorSub = this.isLoggedInSub.asObservable();

  public setUserLoginStatus(status: boolean) {
    this.isLoggedInSub.next(status);
  }

  isLogin(routeUrl: string) {
    if (this.isLoggedIn()) {
      return true;
    } else {
      this.redirectUrl = routeUrl;
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: routeUrl,
        },
      });
      return false;
    }
  }

  private initializeTokens(): void {
    const storedToken = localStorage.getItem('accessToken')
    const storedUser = localStorage.getItem('userInfo')

    if(storedToken) this.#tokenSignal.set(storedToken);

    if(storedUser) this.userService.setUser(JSON.parse(storedUser))
  }
}
