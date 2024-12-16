import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private host = window.location.host
  private devBaseUrl = 'http://localhost:3000/api'
  private prodBaseUrl = 'https://lbrdc-billing-system.netlify.app/.netlify/functions/api'
  http = inject(HttpClient)
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }

  constructor() { }

  addLog(logData: any): Observable<any> {
    // if(this.host.includes('localhost')) {
    //   return this.http.post(`${this.devBaseUrl}/add-log`, logData, this.httpOptions)
    // }
    // else {
    //   return this.http.post(`${this.prodBaseUrl}/add-log`, logData, this.httpOptions)
    // }

    return this.http.post(`${this.devBaseUrl}/add-log`, logData, this.httpOptions)
  }

  getLogs(): Observable<any> {
    // if (this.host.includes('localhost')) {
    //   return this.http.get(`${this.devBaseUrl}/get-logs`, this.httpOptions)
    // } else {
    //   return this.http.get(`${this.prodBaseUrl}/get-logs`, this.httpOptions)
    // }

    return this.http.get(`${this.devBaseUrl}/get-logs`, this.httpOptions)
  }
}
