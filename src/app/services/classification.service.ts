import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClassificationService {
  private host = window.location.host
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  private devBaseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  err = 'An error occured.'

  constructor() { }

  addClass(data: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.post(`${this.devBaseUrl}/add-class`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.post(`${this.prodBaseUrl}/add-class`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.post(`${this.devBaseUrl}/add-class`, data, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  getClasses(offset?: number | null, limit?: number | null): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   if((offset == null || offset == undefined) && (limit == null || limit == undefined)) {
    //     return this.http.get(`${this.devBaseUrl}/get-classes`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.devBaseUrl}/get-classes/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // } else {
    //   if((offset == null || offset == undefined) && (limit == null || limit == undefined)) {
    //     return this.http.get(`${this.prodBaseUrl}/get-classes`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    //   else {
    //     return this.http.get(`${this.prodBaseUrl}/get-classes/${offset}/${limit}`, this.httpOptions)
    //     .pipe(catchError(this.handleError<any>(this.err)))
    //   }
    // }


    if((offset == null || offset == undefined) && (limit == null || limit == undefined)) {
      return this.http.get(`${this.devBaseUrl}/get-classes`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
    else {
      return this.http.get(`${this.devBaseUrl}/get-classes/${offset}/${limit}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
    }
  }

  getClass(id: number): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.get(`${this.devBaseUrl}/get-class/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.get(`${this.prodBaseUrl}/get-class/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.get(`${this.devBaseUrl}/get-class/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  editClass(id: number, data: any): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.put(`${this.devBaseUrl}/edit-class/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.put(`${this.prodBaseUrl}/edit-class/${id}`, data, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.put(`${this.devBaseUrl}/edit-class/${id}`, data, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  delClass(id: number): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.delete(`${this.devBaseUrl}/delete-class/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // } else {
    //   return this.http.delete(`${this.prodBaseUrl}/delete-class/${id}`, this.httpOptions)
    //   .pipe(catchError(this.handleError<any>(this.err)))
    // }

    return this.http.delete(`${this.devBaseUrl}/delete-class/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError<any>(this.err)))
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
