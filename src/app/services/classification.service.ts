import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
const url = require('../helper/const.js');
@Injectable({
  providedIn: 'root',
})
export class ClassificationService {
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

  addClass(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/add-class`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  getClasses(offset?: number | null, limit?: number | null): Observable<any> {
    if (
      (offset == null || offset == undefined) &&
      (limit == null || limit == undefined)
    ) {
      return this.http
        .get(`${this.baseUrl}/get-classes`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    } else {
      return this.http
        .get(`${this.baseUrl}/get-classes/${offset}/${limit}`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    }
  }

  getClass(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/get-class/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  editClass(id: number, data: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/edit-class/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  delClass(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/delete-class/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T);
    };
  }
}
