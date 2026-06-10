import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { ClientDTO } from '@models/client';
import { firstValueFrom } from 'rxjs';

interface ClientResponse {
  client: ClientDTO;
}

interface ClientListResponse {
  clients: ClientDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class Client {
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)

  async list(): Promise<ClientDTO[]> {
    try {
      const res = await firstValueFrom(this.http.get<ClientListResponse>(`${this.apiUrl}/client`))
      return res.clients
    } catch (error) {
      throw new Error(`Failed to fetch clients: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async get(id: string): Promise<ClientDTO> {
    try {
      const res = await firstValueFrom(this.http.get<ClientResponse>(`${this.apiUrl}/client/${id}`))
      return res.client
    } catch (error) {
      throw new Error(`Failed to fetch client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async create(payload: ClientDTO): Promise<ClientDTO> {
    try {
      const res = await firstValueFrom(this.http.post<ClientResponse>(`${this.apiUrl}/client`, payload))
      return res.client
    } catch (error) {
      throw new Error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async update(id: string, payload: Partial<ClientDTO>): Promise<ClientDTO> {
    try {
      const res = await firstValueFrom(this.http.put<ClientResponse>(`${this.apiUrl}/client/${id}`, payload))
      return res.client
    } catch (error) {
      throw new Error(`Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async delete(id: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.delete<any>(`${this.apiUrl}/client/${id}`))
      return res
    } catch (error) {
      throw new Error(`Failed to delete client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async allList(): Promise<ClientDTO[]> {
    try {
      const res = await firstValueFrom(this.http.get<ClientListResponse>(`${this.apiUrl}/client/list`))
      return res.clients
    } catch (error) {
      throw new Error(`Failed to fetch all clients: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
