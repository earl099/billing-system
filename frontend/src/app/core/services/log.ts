/**
 * Audit log service
 * Handles CRUD operations for audit trail entries via the REST API
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { LogDTO } from '@models/log';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Log {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  /**
   * Fetches all audit log entries (admin-only)
   * @returns Array of log records
   */
  async list() {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/log`))
    return res.logs
  }

  /**
   * Fetches a single audit log entry by ID
   * @param id - Log document ID
   * @returns Log record
   */
  async get(id: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/log/${id}`))
    return res.log
  }

  /**
   * Creates a new audit log entry
   * Used to record user operations for accountability tracking
   * 
   * @param payload - Log data containing operation description and user
   * @returns Created log record
   */
  async create(payload: LogDTO) {
    const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/log`, payload))
    return res.log
  }
}
