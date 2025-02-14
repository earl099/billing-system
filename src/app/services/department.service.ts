import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
const url = require('../helper/const.js');
@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  // private baseUrl = 'http://localhost:3000/api'
  private baseUrl = 'https://billing-system-dolz.onrender.com/api';
  http = inject(HttpClient);
  httpOptions = {
    headers: new HttpHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }),
  };

  err = 'An error occured.';

  constructor() {}

  addDept(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/add-dept`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  getDepts(offset?: number | null, limit?: number | null): Observable<any> {
    if (offset == null && limit == null) {
      return this.http
        .get(`${this.baseUrl}/get-depts`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    } else {
      return this.http
        .get(`${this.baseUrl}/get-depts/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    }
  }

  getDept(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/get-dept/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  editDept(id: number, data: any) {
    return this.http
      .put(`${this.baseUrl}/edit-dept/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  delDept(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/delete-dept/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T);
    };
  }
}
