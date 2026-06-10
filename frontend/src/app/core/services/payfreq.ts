import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { PayFreqDTO } from '@models/payfreq';
import { firstValueFrom } from 'rxjs';

interface PayFreqResponse {
  payFreq: PayFreqDTO;
}

interface PayFreqListResponse {
  payFreqs: PayFreqDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class Payfreq {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  async list(): Promise<PayFreqDTO[]> {
    try {
      const res = await firstValueFrom(this.http.get<PayFreqListResponse>(`${this.apiUrl}/payfreq`))
      return res.payFreqs
    } catch (error) {
      throw new Error(`Failed to fetch pay frequencies: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async create(payload: PayFreqDTO): Promise<PayFreqDTO> {
    try {
      const res = await firstValueFrom(this.http.post<PayFreqResponse>(`${this.apiUrl}/payfreq`, payload))
      return res.payFreq
    } catch (error) {
      throw new Error(`Failed to create pay frequency: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async delete(id: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.delete<any>(`${this.apiUrl}/payfreq/${id}`))
      return res
    } catch (error) {
      throw new Error(`Failed to delete pay frequency: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async signupList(): Promise<PayFreqDTO[]> {
    try {
      const res = await firstValueFrom(this.http.get<PayFreqListResponse>(`${this.apiUrl}/payfreq/list`))
      return res.payFreqs
    } catch (error) {
      throw new Error(`Failed to fetch pay frequencies: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
