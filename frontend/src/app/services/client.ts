import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { ClientDTO } from '@models/client';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Client {
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)

  async list() {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/client`))
    return res.clients
  }

  async get(id: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/client/${id}`))
    return res.client
  }

  async create(payload: ClientDTO) {
    const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/client`, payload))
    return res.client
  }

  async update(id: string, payload:Partial<ClientDTO>) {
    const res: any = await firstValueFrom(this.http.put(`${this.apiUrl}/client/${id}`, payload))
    return res.client
  }

  async delete(id: string) {
    const res: any = await firstValueFrom(this.http.delete(`${this.apiUrl}/client/${id}`))
    return res
  }
}
