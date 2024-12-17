import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
const url = require('../helper/const.js');

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  // private baseUrl = 'http://localhost:3000/api'
  private baseUrl = 'https://billing-system-dolz.onrender.com/api';
  redirectUrl!: string;
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  err = 'An error occured.';
  http = inject(HttpClient);

  constructor() {}

  //** GET USERS FUNCTION **//
  getUsers(offset?: number | null, limit?: number | null): Observable<any> {
    if (
      (offset == undefined || offset == null) &&
      (limit == undefined || limit == null)
    ) {
      return this.http
        .get(`${this.baseUrl}/get-users/`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    } else {
      return this.http
        .get(`${this.baseUrl}/get-users/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    }
  }

  //** GET USER FUNCTION **//
  getUser(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/get-user/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //** SIGN UP FUNCTION **//
  signup(userData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/signup`, userData, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }
  //** LOGIN FUNCTION **//
  login(userData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/login`, userData, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //** EDIT DETAILS **//
  editDetails(id: number, user: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/edit-details/${id}`, user, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //** EDIT ACCESS **//
  editAccess(id: number, user: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/edit-access/${id}`, user, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //** DELETE USER **/
  deleteUser(id: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/delete-user/${id}`,
      this.httpOptions
    );
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

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T);
    };
  }

  isLoggedIn() {
    const userToken = this.getToken('token');

    if (userToken != null) {
      return true;
    } else {
      return false;
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
}
