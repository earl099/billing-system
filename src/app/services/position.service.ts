import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private baseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'

  constructor() { }

  addPosition(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/add-position`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  getPositions(offset?: number | null, limit?: number | null): Observable<any> {
    if(offset == null && limit == null) {
      return this.http.get(`${this.baseUrl}/get-positions`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.baseUrl}/get-positions/${offset}/${limit}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  getPosition(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-position/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  editPosition(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/edit-position/${id}`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  delPosition(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/delete-position/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
