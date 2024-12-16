import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private host = window.location.host
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  private devBaseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'

  constructor() { }

  addLoc(data: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.post(`${this.devBaseUrl}/add-location`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.post(`${this.prodBaseUrl}/add-location`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.post(`${this.devBaseUrl}/add-location`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  getLocs(offset?: number | null, limit?: number | null): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   if(offset == null && limit == null) {
    //     return this.http.get(`${this.devBaseUrl}/get-locations`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.devBaseUrl}/get-locations/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // } else {
    //   if(offset == null && limit == null) {
    //     return this.http.get(`${this.prodBaseUrl}/get-locations`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.prodBaseUrl}/get-locations/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // }

    if(offset == null && limit == null) {
      return this.http.get(`${this.devBaseUrl}/get-locations`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.devBaseUrl}/get-locations/${offset}/${limit}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  getLoc(id: number): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.get(`${this.devBaseUrl}/get-location/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.get(`${this.prodBaseUrl}/get-location/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.get(`${this.devBaseUrl}/get-location/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  editLoc(id: number, data: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.put(`${this.devBaseUrl}/edit-location/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.put(`${this.prodBaseUrl}/edit-location/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.put(`${this.devBaseUrl}/edit-location/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  delLoc(id: number): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.delete(`${this.devBaseUrl}/delete-location/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.delete(`${this.prodBaseUrl}/delete-location/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.delete(`${this.devBaseUrl}/delete-location/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
