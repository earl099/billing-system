import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
const url = require('../helper/const.js');
@Injectable({
  providedIn: 'root',
})
export class LocationService {
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

  addLoc(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/add-location`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  getLocs(offset?: number | null, limit?: number | null): Observable<any> {
    if (offset == null && limit == null) {
      return this.http
        .get(`${this.baseUrl}/get-locations`, this.httpOptions)
        .pipe(catchError(this.handleError<any>(this.err)));
    } else {
      return this.http
        .get(
          `${this.baseUrl}/get-locations/${offset}/${limit}`,
          this.httpOptions
        )
        .pipe(catchError(this.handleError<any>(this.err)));
    }
  }

  getLoc(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/get-location/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  editLoc(id: number, data: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/edit-location/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  delLoc(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/delete-location/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)));
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T);
    };
  }
}
