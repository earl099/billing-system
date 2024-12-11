import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PayFreqService {
  private host = window.location.host
  private devBaseUrl = 'http://localhost:3000/api'
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }
  err = 'An error occured.'

  constructor() { }

  addPayFreq(data: any): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.post(`${this.devBaseUrl}/add-payFreq`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.post(`${this.prodBaseUrl}/add-payFreq`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  getPayFreqs(): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.get(`${this.devBaseUrl}/get-payFreqs`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.get(`${this.prodBaseUrl}/get-payFreqs`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  getPayFreq(id: number): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.get(`${this.devBaseUrl}/get-payFreq/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.get(`${this.prodBaseUrl}/get-payFreq/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  editPayFreq(id: number, data: any): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.put(`${this.devBaseUrl}/edit-payFreq/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.put(`${this.prodBaseUrl}/edit-payFreq/${id}`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  delPayFreq(id: number): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.delete(`${this.devBaseUrl}/delete-payFreq/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.delete(`${this.prodBaseUrl}/delete-payFreq/${id}`, this.httpOptions)
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
