import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileEditor {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  async getTemplates(code: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/editor/templates/${code.toLowerCase()}`))
    return res
  }

  async createBillingDocument(templateId: string, code: string, data: any, isBlank: boolean, type: 'word' | 'excel') {

    const res: any = await firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/editor/create/${code}/${type}`,
        {
          templateId,
          data,
          isBlank
        }
      )
    )
    return res
  }

  async exportPdf(id: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/word/export/${id}`, { responseType: 'blob' }))
    return res
  }
}
