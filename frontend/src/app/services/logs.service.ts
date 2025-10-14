import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogsService {
  private baseUrl = environment.apiUrl
  //private baseUrl = 'https://billing-system-dolz.onrender.com/api';
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  private http = inject(HttpClient)

  addLog(logData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/log`, logData, this.httpOptions);
  }

  getLogs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/log`, this.httpOptions);
  }
}
