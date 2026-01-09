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

  async acidBilling(letter: File, attachments: File[]) {
    const fd = new FormData()
    fd.append('billingLetter', letter)
    attachments.forEach(f => fd.append('attachments', f))

    const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/acid/generate`, fd))
    return res
  }
}
