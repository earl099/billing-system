import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { UserDTO } from '@models/user';
import { firstValueFrom } from 'rxjs';

interface UserResponse {
  user: UserDTO;
}

interface UserListResponse {
  users: UserDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class User {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  async list(): Promise<UserDTO[]> {
    try {
      const res = await firstValueFrom(this.http.get<UserListResponse>(`${this.apiUrl}/user`))
      return res.users
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async get(id: string): Promise<UserDTO> {
    try {
      const res = await firstValueFrom(this.http.get<UserResponse>(`${this.apiUrl}/user/${id}`))
      return res.user
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async create(payload: UserDTO): Promise<UserDTO> {
    try {
      const res = await firstValueFrom(this.http.post<UserResponse>(`${this.apiUrl}/user`, payload))
      return res.user
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async update(id: string, payload: Partial<UserDTO>): Promise<UserDTO> {
    try {
      const res = await firstValueFrom(this.http.put<UserResponse>(`${this.apiUrl}/user/${id}`, payload))
      return res.user
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async delete(id: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.delete<any>(`${this.apiUrl}/user/${id}`))
      return res
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
