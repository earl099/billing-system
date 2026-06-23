/**
 * Pay frequency service
 * Handles CRUD operations for pay frequency configurations via the REST API
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
import { PayFreqDTO } from '@models/payfreq';
import { firstValueFrom } from 'rxjs';

/** Single pay frequency API response shape */
interface PayFreqResponse {
  payFreq: PayFreqDTO;
}

/** Pay frequency list API response shape */
interface PayFreqListResponse {
  payFreqs: PayFreqDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class Payfreq {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  /**
   * Fetches all pay frequencies (admin-only endpoint)
   * @returns Array of pay frequency records
   */
  async list(): Promise<PayFreqDTO[]> {
    try {
      const res = await firstValueFrom(this.http.get<PayFreqListResponse>(`${this.apiUrl}/payfreq`))
      return res.payFreqs
    } catch (error) {
      throw new Error(`Failed to fetch pay frequencies: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Creates a new pay frequency
   * @param payload - Pay frequency data (payType)
   * @returns Created pay frequency record
   */
  async create(payload: PayFreqDTO): Promise<PayFreqDTO> {
    try {
      const res = await firstValueFrom(this.http.post<PayFreqResponse>(`${this.apiUrl}/payfreq`, payload))
      return res.payFreq
    } catch (error) {
      throw new Error(`Failed to create pay frequency: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deletes a pay frequency by ID
   * @param id - Pay frequency document ID
   * @returns Deletion confirmation response
   */
  async delete(id: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.delete<any>(`${this.apiUrl}/payfreq/${id}`))
      return res
    } catch (error) {
      throw new Error(`Failed to delete pay frequency: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetches pay frequencies from the public signup endpoint
   * Used during registration to populate pay frequency selection
   * @returns Array of pay frequency records
   */
  async signupList(): Promise<PayFreqDTO[]> {
    try {
      const res = await firstValueFrom(this.http.get<PayFreqListResponse>(`${this.apiUrl}/payfreq/list`))
      return res.payFreqs
    } catch (error) {
      throw new Error(`Failed to fetch pay frequencies: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
