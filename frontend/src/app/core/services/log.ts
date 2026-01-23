import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
import { LogDTO } from '@models/log';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Log {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  async list() {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/log`))
    return res.logs
  }

  async get(id: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/log/${id}`))
    return res.log
  }

  async create(payload: LogDTO) {
    const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/log`, payload))
    return res.log
  }
}
