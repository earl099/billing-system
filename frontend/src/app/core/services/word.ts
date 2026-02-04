import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Word {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  async getTemplates() {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/word/templates`))
    return res
  }

  async createDocument(templateId: string) {
    const res: any = await firstValueFrom(this.http.post<any>(`${this.apiUrl}/word/create`, { templateId }))
    return res
  }

  async exportPdf(id: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/word/export/${id}`, { responseType: 'blob' }))
    return res
  }
}
