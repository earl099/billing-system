import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '@env/environment.prod';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Billing {
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)
  private sanitizer = inject(DomSanitizer)


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

  async acidBillingPreview(formData: FormData) {
    const res: any = await firstValueFrom(
      this.http.post<any>(
        `${this.apiUrl}/acid/preview`,
        formData,
        { withCredentials: true }
      )
    )
    return res.previewFiles.map((p: any) => ({
      public_id: p.public_id,
      secure_url: this.sanitizer.bypassSecurityTrustResourceUrl(p.secure_url),
      label: p.label
    }))
  }

  async cleanup(previewPublicIds: string[]) {
    const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/acid/cleanup`, { previewPublicIds }))
    return res
  }
}
