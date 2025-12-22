import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class User {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  async list() {
    
  }
}
