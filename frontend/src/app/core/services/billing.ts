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


  async acidBillingGenerate(
    fd: FormData,
    previewPublicIds: string[],
    previewUrls: string[],
    mode: 'preview' | 'direct'
  ) {
      fd.append('mode', mode)
      const res: any = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/acid/generate`, fd, { withCredentials: true }))
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
    return res.previews.map((p: any) => ({
      public_id: p.public_id,
      safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(p.url),
      rawUrl: p.url,
      label: p.label
    }))
  }

  async cleanup(previewPublicIds: string[]) {
    if(!previewPublicIds.length) return

    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/acid/cleanup`,
        { previewPublicIds },
        { withCredentials: true }
      )
    )
  }
}
