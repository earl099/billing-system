import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private host = window.location.host
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  private devBaseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'

  constructor() { }

  addDept(data: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.post(`${this.devBaseUrl}/add-dept`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.post(`${this.prodBaseUrl}/add-dept`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.post(`${this.devBaseUrl}/add-dept`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  getDepts(offset?: number | null, limit?: number | null): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   if(offset == null && limit == null) {
    //     return this.http.get(`${this.devBaseUrl}/get-depts`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.devBaseUrl}/get-depts/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // } else {
    //   if(offset == null && limit == null) {
    //     return this.http.get(`${this.prodBaseUrl}/get-depts`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.prodBaseUrl}/get-depts/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // }

    if(offset == null && limit == null) {
      return this.http.get(`${this.devBaseUrl}/get-depts`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.devBaseUrl}/get-depts/${offset}/${limit}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  getDept(id: number): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.get(`${this.devBaseUrl}/get-dept/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.get(`${this.prodBaseUrl}/get-dept/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.get(`${this.devBaseUrl}/get-dept/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  editDept(id: number, data: any) {
    // if (this.host.includes('localhost')) {
    //   return this.http.put(`${this.devBaseUrl}/edit-dept/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.put(`${this.prodBaseUrl}/edit-dept/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.put(`${this.devBaseUrl}/edit-dept/${id}`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  delDept(id: number): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.delete(`${this.devBaseUrl}/delete-dept/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.delete(`${this.prodBaseUrl}/delete-dept/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.delete(`${this.devBaseUrl}/delete-dept/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
