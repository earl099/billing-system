import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private host = window.location.host
  private devBaseUrl = 'http://localhost:3000/api'
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'

  constructor() { }

  addPosition(data: any): Observable<any> {
    // if(this.host.includes('localhost')) {
    //   return this.http.post(`${this.devBaseUrl}/add-position`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }
    // else {
    //   return this.http.post(`${this.prodBaseUrl}/add-position`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.post(`${this.devBaseUrl}/add-position`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  getPositions(offset?: number | null, limit?: number | null): Observable<any> {
    // if(this.host.includes('localhost')) {
    //   if(offset == null && limit == null) {
    //     return this.http.get(`${this.devBaseUrl}/get-positions`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.prodBaseUrl}/get-positions/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // }
    // else {
    //   if(offset == null && limit == null) {
    //     return this.http.get(`${this.devBaseUrl}/get-positions`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.prodBaseUrl}/get-positions/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // }

    if(offset == null && limit == null) {
      return this.http.get(`${this.devBaseUrl}/get-positions`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.prodBaseUrl}/get-positions/${offset}/${limit}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  getPosition(id: number): Observable<any> {
    // if(this.host.includes('localhost')) {
    //   return this.http.get(`${this.devBaseUrl}/get-position/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }
    // else {
    //   return this.http.get(`${this.prodBaseUrl}/get-position/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.get(`${this.devBaseUrl}/get-position/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  editPosition(id: number, data: any): Observable<any> {
    // if(this.host.includes('localhost')) {
    //   return this.http.put(`${this.devBaseUrl}/edit-position/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }
    // else {
    //   return this.http.put(`${this.prodBaseUrl}/edit-position/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.put(`${this.devBaseUrl}/edit-position/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  delPosition(id: number): Observable<any> {
    // if(this.host.includes('localhost')) {
    //   return this.http.get(`${this.devBaseUrl}/delete-position/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }
    // else {
    //   return this.http.get(`${this.prodBaseUrl}/delete-position/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.get(`${this.devBaseUrl}/delete-position/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
