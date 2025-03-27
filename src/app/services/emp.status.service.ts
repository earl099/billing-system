import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
const url = require('../helper/const.js');
@Injectable({
  providedIn: 'root',
})
export class EmpStatusService {
  private baseUrl = 'http://localhost:3000/api'
  // private baseUrl = 'https://billing-system-dolz.onrender.com/api';
  http = inject(HttpClient);
  httpOptions = {
    headers: new HttpHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }),
  };

  err = 'An error occured.';

  constructor() {}

  addEmpStatus(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/add-emp-status`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  getEmpStatuses(
    offset?: number | null,
    limit?: number | null
  ): Observable<any> {
    if (offset == null && limit == null) {
      return this.http
        .get(`${this.baseUrl}/get-emp-statuses`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    } else {
      return this.http
        .get(
          `${this.baseUrl}/get-emp-statuses/${offset}/${limit}`,
          this.httpOptions
        )
        .pipe(catchError(this.handleError<any>(this.err)));
    }
  }

  getEmpStatus(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/get-emp-status/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  editEmpStatus(id: number, data: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/edit-emp-status/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  delEmpStatus(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/delete-emp-status/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T);
    };
  }
}
