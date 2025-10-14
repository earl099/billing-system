import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = environment.apiUrl

  private httpOptions = {
    headers: new HttpHeaders({ 'Content/Type': 'application/json' })
  }
  
  constructor() { }

}
