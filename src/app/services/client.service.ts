import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private host = window.location.host
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  private devBaseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'
  constructor() { }

  addClient(data: any): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.post(`${this.devBaseUrl}/add-client`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.post(`${this.prodBaseUrl}/add-client`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  getClients(offset?:number | null, limit?: number | null): Observable<any> {
    if (this.host.includes('localhost')) {
      if((offset == null || offset == undefined) && (limit == null || limit == undefined)) {
        return this.http.get(`${this.devBaseUrl}/get-clients`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
      else {
        return this.http.get(`${this.devBaseUrl}/get-clients/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
    } else {
      if((offset == null || offset == undefined) && (limit == null || limit == undefined)) {
        return this.http.get(`${this.prodBaseUrl}/get-clients`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
      else {
        return this.http.get(`${this.prodBaseUrl}/get-clients/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)))
      }
    }

  }

  getClient(id: number): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.get(`${this.devBaseUrl}/get-client/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.get(`${this.prodBaseUrl}/get-client/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  editClient(data: any, id: number): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.put(`${this.devBaseUrl}/edit-client/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.put(`${this.prodBaseUrl}/edit-client/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }

  }

  deleteClient(id: number): Observable<any> {
    if (this.host.includes('localhost')) {
      return this.http.delete(`${this.devBaseUrl}/delete-client/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    } else {
      return this.http.delete(`${this.prodBaseUrl}/delete-client/${id}`, this.httpOptions)
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
