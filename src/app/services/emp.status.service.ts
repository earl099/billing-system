import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmpStatusService {
  private host = window.location.host
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  private devBaseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'

  constructor() { }

  addEmpStatus(data: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.post(`${this.devBaseUrl}/add-emp-status`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.post(`${this.prodBaseUrl}/add-emp-status`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.post(`${this.devBaseUrl}/add-emp-status`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  getEmpStatuses(offset?: number | null, limit?: number | null): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   if(offset == null && limit == null) {
    //     return this.http.get(`${this.devBaseUrl}/get-emp-statuses`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.devBaseUrl}/get-emp-statuses/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // } else {
    //   if(offset == null && limit == null) {
    //     return this.http.get(`${this.prodBaseUrl}/get-emp-statuses`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.prodBaseUrl}/get-emp-statuses/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // }

    if(offset == null && limit == null) {
      return this.http.get(`${this.devBaseUrl}/get-emp-statuses`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.devBaseUrl}/get-emp-statuses/${offset}/${limit}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  getEmpStatus(id: number): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.get(`${this.devBaseUrl}/get-emp-status/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.get(`${this.devBaseUrl}/get-emp-status/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.get(`${this.devBaseUrl}/get-emp-status/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  editEmpStatus(id: number, data: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.put(`${this.devBaseUrl}/edit-emp-status/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.put(`${this.prodBaseUrl}/edit-emp-status/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.put(`${this.devBaseUrl}/edit-emp-status/${id}`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  delEmpStatus(id: number): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.get(`${this.devBaseUrl}/delete-emp-status/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.get(`${this.prodBaseUrl}/delete-emp-status/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.get(`${this.devBaseUrl}/delete-emp-status/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
