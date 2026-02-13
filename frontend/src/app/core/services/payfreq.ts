import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { PayFreqDTO } from '@models/payfreq';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Payfreq {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  async list() {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/payfreq`))
    return res.payFreqs
  }

  async create(payload: PayFreqDTO) {
    const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/payfreq`, payload))
    return res.payFreq
  }

  async delete(id: string) {
    const res: any = await firstValueFrom(this.http.delete(`${this.apiUrl}/payfreq/${id}`))
    return res
  }

  async signupList() {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/payfreq/list`))
    return res.payFreqs
  }
}
