/**
 * Client service
 * Handles CRUD operations for client organizations via the REST API
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
import { ClientDTO } from '@models/client';
import { firstValueFrom } from 'rxjs';

/** Single client API response shape */
interface ClientResponse {
  client: ClientDTO;
}

/** Client list API response shape */
interface ClientListResponse {
  clients: ClientDTO[];
}

/** Client fields exposed by the public registration options endpoint */
export interface SignupClientDTO {
  _id?: string;
  code: string;
  name: string;
}

/** Public signup configuration response shape */
interface SignupOptionsResponse {
  clients: SignupClientDTO[];
  hasAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Client {
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)
  /** Reused by the shell and dashboard when they load at the same time. */
  private allClients: ClientDTO[] | null = null
  private allClientsRequest: Promise<ClientDTO[]> | null = null

  /**
   * Fetches all clients (admin-only endpoint)
   * @returns Array of all client records
   */
  async list(): Promise<ClientDTO[]> {
    try {
      const res = await firstValueFrom(this.http.get<ClientListResponse>(`${this.apiUrl}/client`))
      return res.clients
    } catch (error) {
      throw new Error(`Failed to fetch clients: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetches a single client by MongoDB ID
   * @param id - Client document ID
   * @returns Client record
   */
  async get(id: string): Promise<ClientDTO> {
    try {
      const res = await firstValueFrom(this.http.get<ClientResponse>(`${this.apiUrl}/client/${id}`))
      return res.client
    } catch (error) {
      throw new Error(`Failed to fetch client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Creates a new client
   * @param payload - Client data (code, name, payFreq)
   * @returns Created client record
   */
  async create(payload: ClientDTO): Promise<ClientDTO> {
    try {
      const res = await firstValueFrom(this.http.post<ClientResponse>(`${this.apiUrl}/client`, payload))
      this.clearAllClientsCache()
      return res.client
    } catch (error) {
      throw new Error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Updates an existing client
   * @param id - Client document ID
   * @param payload - Partial client data to update
   * @returns Updated client record
   */
  async update(id: string, payload: Partial<ClientDTO>): Promise<ClientDTO> {
    try {
      const res = await firstValueFrom(this.http.put<ClientResponse>(`${this.apiUrl}/client/${id}`, payload))
      this.clearAllClientsCache()
      return res.client
    } catch (error) {
      throw new Error(`Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deletes a client by ID
   * @param id - Client document ID
   * @returns Deletion confirmation response
   */
  async delete(id: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.delete<any>(`${this.apiUrl}/client/${id}`))
      this.clearAllClientsCache()
      return res
    } catch (error) {
      throw new Error(`Failed to delete client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetches public signup options, including selectable clients and admin status.
   */
  async signupOptions(): Promise<SignupOptionsResponse> {
    try {
      return await firstValueFrom(this.http.get<SignupOptionsResponse>(`${this.apiUrl}/signup/options`))
    } catch (error: unknown) {
      throw new Error(`Failed to fetch signup options: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /** Fetches the client list used by existing signup callers. */
  async allList(): Promise<ClientDTO[]> {
    if (this.allClients) return this.allClients

    if (!this.allClientsRequest) {
      this.allClientsRequest = firstValueFrom(this.http.get<ClientListResponse>(`${this.apiUrl}/client/list`))
        .then((res) => {
          this.allClients = res.clients
          return res.clients
        })
        .catch((error: unknown) => {
          throw new Error(`Failed to fetch all clients: ${error instanceof Error ? error.message : 'Unknown error'}`)
        })
        .finally(() => {
          this.allClientsRequest = null
        })
    }

    return this.allClientsRequest
  }

  private clearAllClientsCache(): void {
    this.allClients = null
    this.allClientsRequest = null
  }
}
