import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router)
  private host = window.location.host
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  private devBaseUrl = 'http://localhost:3000/api'
  redirectUrl!: string
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }
  err = 'An error occured.'
  http = inject(HttpClient)

  constructor() { }

  //** GET USERS FUNCTION **//
  getUsers(offset?: number | null, limit?: number | null): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   if((offset == undefined || offset == null) && (limit == undefined || limit == null)) {
    //     return this.http.get(`${this.devBaseUrl}/get-users/`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.devBaseUrl}/get-users/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // } else {
    //   if((offset == undefined || offset == null) && (limit == undefined || limit == null)) {
    //     return this.http.get(`${this.prodBaseUrl}/get-users/`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.prodBaseUrl}/get-users/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // }


    if((offset == undefined || offset == null) && (limit == undefined || limit == null)) {
      return this.http.get(`${this.devBaseUrl}/get-users/`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.devBaseUrl}/get-users/${offset}/${limit}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  //** GET USER FUNCTION **//
  getUser(id: number): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.get(`${this.devBaseUrl}/get-user/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.get(`${this.prodBaseUrl}/get-user/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.get(`${this.devBaseUrl}/get-user/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  //** SIGN UP FUNCTION **//
  signup(userData: any): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.post(`${this.devBaseUrl}/signup`, userData, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.post(`${this.prodBaseUrl}/signup`, userData, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }

  }
  //** LOGIN FUNCTION **//
  login(userData: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.post(`${this.devBaseUrl}/login`, userData, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.post(`${this.prodBaseUrl}/login`, userData, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }


    return this.http.post(`${this.devBaseUrl}/login`, userData, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  //** EDIT DETAILS **//
  editDetails(id: number, user: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.put(`${this.devBaseUrl}/edit-details/${id}`, user, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.put(`${this.devBaseUrl}/edit-details/${id}`, user, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }


    return this.http.put(`${this.devBaseUrl}/edit-details/${id}`, user, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  //** EDIT ACCESS **//
  editAccess(id: number, user: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.put(`${this.devBaseUrl}/edit-access/${id}`, user, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.put(`${this.prodBaseUrl}/edit-access/${id}`, user, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.put(`${this.devBaseUrl}/edit-access/${id}`, user, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  //** DELETE USER **/
  deleteUser(id: number):Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.delete(`${this.devBaseUrl}/delete-user/${id}`, this.httpOptions)
    // } else {
    //   return this.http.delete(`${this.prodBaseUrl}/delete-user/${id}`, this.httpOptions)
    // }

    return this.http.delete(`${this.devBaseUrl}/delete-user/${id}`, this.httpOptions)
  }

  //** TOKEN FUNCTIONS **//
  //set new token
  setToken(key: string, value: string) {
    localStorage.setItem(key, value)
  }

  //get token
  getToken(key: string) {
    return localStorage.getItem(key)
  }

  //delete token
  deleteToken() {
    localStorage.clear()
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }

  isLoggedIn() {
    const userToken = this.getToken('token')

    if(userToken != null) {
      return true
    }
    else {
      return false
    }
  }

  public isLoggedInSub = new BehaviorSubject<boolean>(false)
  public isLoggedInBehaviorSub = this.isLoggedInSub.asObservable()

  public setUserLoginStatus(status: boolean) {
    this.isLoggedInSub.next(status)
  }

  isLogin(routeUrl: string) {
    if(this.isLoggedIn()) {
      return true
    }
    else {
      this.redirectUrl = routeUrl
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: routeUrl
        }
      })
      return false
    }
  }
}
