/**
 * User management service
 * Handles CRUD operations for user accounts via the REST API (admin-only)
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { UserDTO } from '@models/user';
import { firstValueFrom } from 'rxjs';

/** Single user API response shape */
interface UserResponse {
  user: UserDTO;
}

/** User list API response shape */
interface UserListResponse {
  users: UserDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class User {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  /**
   * Fetches all users (admin-only, excludes passwords)
   * @returns Array of user records
   */
  async list(): Promise<UserDTO[]> {
    try {
      const res = await firstValueFrom(this.http.get<UserListResponse>(`${this.apiUrl}/user`))
      return res.users
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetches a single user by MongoDB ID (excludes password)
   * @param id - User document ID
   * @returns User record
   */
  async get(id: string): Promise<UserDTO> {
    try {
      const res = await firstValueFrom(this.http.get<UserResponse>(`${this.apiUrl}/user/${id}`))
      return res.user
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Creates a new user account
   * @param payload - User data (name, username, email, password, role, handledClients)
   * @returns Created user record (without password)
   */
  async create(payload: UserDTO): Promise<UserDTO> {
    try {
      const res = await firstValueFrom(this.http.post<UserResponse>(`${this.apiUrl}/user`, payload))
      return res.user
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Updates an existing user
   * @param id - User document ID
   * @param payload - Partial user data to update
   * @returns Updated user record (without password)
   */
  async update(id: string, payload: Partial<UserDTO>): Promise<UserDTO> {
    try {
      const res = await firstValueFrom(this.http.put<UserResponse>(`${this.apiUrl}/user/${id}`, payload))
      return res.user
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deletes a user by ID
   * @param id - User document ID
   * @returns Deletion confirmation response
   */
  async delete(id: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.delete<any>(`${this.apiUrl}/user/${id}`))
      return res
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
