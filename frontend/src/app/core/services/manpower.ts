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

  async getManpower(
    code: string,
    index: number,
    fileName: string,
    tableName: string
  ) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/manpower/${code}/${index}?fileName=${fileName}&tableName=${tableName}`))
    return res
  }

  async addToTable(
    code: string,
    fileName: string,
    tableName: string,
    data: any
  ) {
    const res: any = await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/manpower/${code}/add?fileName=${fileName}&tableName=${tableName}`,
        data
      )
    )
    return res
  }

  async updateRow(
    code: string,
    index: number,
    fileName: string,
    tableName: string,
    payload: any
  ) {
    const res: any = await firstValueFrom(this.http.patch(
        `${this.apiUrl}/manpower/${code}/${index}/edit?fileName=${fileName}&tableName=${tableName}`,
        payload
      )
    )
    return res
  }
}
