import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Manpower {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  async listManpower(code: string, fileName: string, tableName: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/manpower/${code}/list?fileName=${fileName}&tableName=${tableName}`))
    return res.list
  }

  async getManpower(code: string, index: number, fileName: string, tableName: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/manpower/${code}/${index}?fileName=${fileName}&tableName=${tableName}`))
    return res
  }
}
