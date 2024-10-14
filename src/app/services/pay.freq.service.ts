import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PayFreqService {
  private baseUrl = 'http://localhost:3000/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }
  err = 'An error occured.'

  constructor() { }

  addPayFreq(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/add-payFreq`, data, this.httpOptions)
  }

  getPayFreqs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-payFreqs`, this.httpOptions)
  }

  getPayFreq(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/get/payFreq/${id}`, this.httpOptions)
    .pipe(catchError(this.handleError<any>(this.err)))
  }

  //error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (): Observable<T> => {
      return of(result as T)
    }
  }
}
