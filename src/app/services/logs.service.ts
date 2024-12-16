import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogsService {
  // private baseUrl = 'http://localhost:3000/api'
  private baseUrl = 'https://billingsez.onrender.com/api';
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(private http: HttpClient) {}

  addLog(logData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/add-log`, logData, this.httpOptions);
  }

  getLogs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-logs`, this.httpOptions);
  }
}
