import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormerEmpService {
  private baseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'
  constructor() { }

  addFormerEmp(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/add-former-emp`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  getFormerEmps(offset?: number | null, limit?: number | null): Observable<any> {
    if(offset == null && limit == null) {
      return this.http.get(`${this.baseUrl}/get-former-emps`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.baseUrl}/get-former-emps/${offset}/${limit}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  getFormerEmp(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-former-emp/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  editFormerEmp(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/edit-former-emp/${id}`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  delFormerEmp(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete-former-emp/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
