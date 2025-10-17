import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Client } from '@models/client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = environment.apiUrl

  private httpOptions = {
    headers: new HttpHeaders({ 'Content/Type': 'application/json' })
  }

  private http = inject(HttpClient)

  addClient(clientData: Client): Observable<any> {
    return this.http.post(`${this.baseUrl}/client`, clientData, this.httpOptions)
  }

  getClients(): Observable<any> {
    return this.http.get(`${this.baseUrl}/client`, this.httpOptions)
  }

  getClient(_id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/client/${_id}`, this.httpOptions)
  }

  updateClient(_id: string, clientData: Client): Observable<any> {
    return this.http.put(`${this.baseUrl}/client/${_id}`, clientData)
  }

  deleteClient(_id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/client/${_id}`, this.httpOptions)
  }
}
