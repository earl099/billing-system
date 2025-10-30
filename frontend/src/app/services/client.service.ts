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

  private http = inject(HttpClient)

  addClient(clientData: Client): Observable<any> {
    return this.http.post(`${this.baseUrl}/client`, clientData)
  }

  getClients(): Observable<any> {
    return this.http.get(`${this.baseUrl}/client`)
  }

  getClient(_id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/client/${_id}`)
  }

  updateClient(_id: string, clientData: Client): Observable<any> {
    return this.http.put(`${this.baseUrl}/client/${_id}`, clientData)
  }

  deleteClient(_id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/client/${_id}`)
  }
}
