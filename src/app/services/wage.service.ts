import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WageService {
  private baseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'

  constructor() { }

  addWage(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/add-wage`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  getWages(offset?: number | null, limit?: number | null): Observable<any> {
    if(offset == null && limit == null) {
      return this.http.get(`${this.baseUrl}/get-wages`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.baseUrl}/get-wages/${offset}/${limit}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  getWage(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-wage/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  editWage(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/edit-wage/${id}`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  delWage(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete-wage/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
