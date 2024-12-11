import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WageService {
  private host = window.location.host
  private devBaseUrl = 'http://localhost:3000/api'
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'



  constructor() { }

  addWage(data: any): Observable<any> {
    if(this.host.includes('localhost')) {
      return this.http.post(`${this.devBaseUrl}/add-wage`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.post(`${this.prodBaseUrl}/add-wage`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  getWages(offset?: number | null, limit?: number | null): Observable<any> {
    if(this.host.includes('localhost')) {
      if(offset == null && limit == null) {
        return this.http.get(`${this.devBaseUrl}/get-wages`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
      else {
        return this.http.get(`${this.devBaseUrl}/get-wages/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
    }
    else {
      if(offset == null && limit == null) {
        return this.http.get(`${this.prodBaseUrl}/get-wages`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
      else {
        return this.http.get(`${this.prodBaseUrl}/get-wages/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
    }
  }

  getWage(id: number): Observable<any> {
    if(this.host.includes('localhost')) {
      return this.http.get(`${this.devBaseUrl}/get-wage/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.prodBaseUrl}/get-wage/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  editWage(id: number, data: any): Observable<any> {
    if(this.host.includes('localhost')) {
      return this.http.put(`${this.devBaseUrl}/edit-wage/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.put(`${this.prodBaseUrl}/edit-wage/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  delWage(id: number): Observable<any> {
    if(this.host.includes('localhost')) {
      return this.http.delete(`${this.devBaseUrl}/delete-wage/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.delete(`${this.devBaseUrl}/delete-wage/${id}`, this.httpOptions)
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
