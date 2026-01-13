import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Billing {
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)

  private form(letter: File, attachments: File[]) {
    const fd = new FormData()
    fd.append('billingLetter', letter)
    attachments.forEach(a => fd.append('attachments', a))
    return fd
  }

  async acidBillingGenerate(fd: FormData) {
    const res: any = await firstValueFrom(this.http.post<any>(`${this.apiUrl}/acid/generate`, fd))
    return res
  }

  async acidBillingPreview(letter: File, attachments: File[]) {
    const res: any = await firstValueFrom(this.http.post<any>(`${this.apiUrl}/acid/preview`, this.form(letter, attachments)))
    return res
  }

  
}
