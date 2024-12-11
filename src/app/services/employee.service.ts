import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private host = window.location.host
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  private devBaseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'

  constructor() { }

  addEmp(data:any): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.post(`${this.devBaseUrl}/add-employee`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.post(`${this.prodBaseUrl}/add-employee`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  getEmps(offset?: number | null, limit?: number | null): Observable<any> {
    if (this.host.includes('localhost')) {
      if(offset == null && limit == null) {
        return this.http.get(`${this.devBaseUrl}/get-employees`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
      else {
        return this.http.get(`${this.devBaseUrl}/get-employees/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
    } else {
      if(offset == null && limit == null) {
        return this.http.get(`${this.prodBaseUrl}/get-employees`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
      else {
        return this.http.get(`${this.prodBaseUrl}/get-employees/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
    }

  }

  getEmp(id: number): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.get(`${this.devBaseUrl}/get-employee/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.get(`${this.prodBaseUrl}/get-employee/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  editEmp(id: number, data: any): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.put(`${this.devBaseUrl}/edit-employee/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.put(`${this.prodBaseUrl}/edit-employee/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  delEmp(id: number): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.delete(`${this.devBaseUrl}/delete-employee/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.delete(`${this.devBaseUrl}/delete-employee/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
