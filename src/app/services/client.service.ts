import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
const url = require('../helper/const.js');
@Injectable({
  providedIn: 'root',
})
export class ClientService {
  // private baseUrl = 'http://localhost:3000/api'
  private baseUrl = 'https://billing-system-dolz.onrender.com/api';
  http = inject(HttpClient);
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  err = 'An error occured.';
  constructor() {}

  addClient(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/add-client`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  getClients(offset?: number | null, limit?: number | null): Observable<any> {
    if (
      (offset == null || offset == undefined) &&
      (limit == null || limit == undefined)
    ) {
      return this.http
        .get(`${this.baseUrl}/get-clients`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    } else {
      return this.http
        .get(`${this.baseUrl}/get-clients/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    }
  }

  getClient(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/get-client/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  editClient(data: any, id: number): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/edit-client/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  deleteClient(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/delete-client/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T);
    };
  }
}
