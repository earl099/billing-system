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

  //** ACID BILLING STARTS HERE **//
async billingGenerate(
  code: string,
  fd: FormData,
  _previewPublicIds: string[],
  _previewUrls: string[],
  mode: 'preview' | 'direct'
) {
    fd.append('mode', mode)
    const res: any = await firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/${code}/generate`, fd, { withCredentials: true }))
    return res
}

async billingPreview(code: string, formData: FormData) {
  const res: any = await firstValueFrom(
    this.http.post<any>(
      `${this.apiUrl}/${code}/preview`,
      formData,
      { withCredentials: true }
    )
  )

  return res.previews.map((p: any) => ({
    public_id: p.public_id,
    rawUrl: p.url,   // ✅ FIXED
    safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(p.url),
    label: p.label
  }))
}




async download(publicId: string) {
  const blob = await firstValueFrom(
    this.http.get(
      `${this.apiUrl}/billing/download/${encodeURIComponent(publicId)}`,
      { responseType: 'blob', withCredentials: true }
    )
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = publicId.split('/').pop() + '.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

async billingList(code: string) {
  const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/${code}/list`, { withCredentials: true }))
  return res.list
}

async billingDetails(id: string, code: string) {
  const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/${code}/${id}`, { withCredentials: true }))
  return res.acidBilling
}

async deleteBilling(_id: string, code: string) {
  const res: any = await firstValueFrom(this.http.delete(`${this.apiUrl}/${code}/${_id}`, { withCredentials: true }))
  return res
}

//** ACID BILLING ENDS HERE **//

  async cleanup(previewPublicIds: string[], client: string) {
    if(!previewPublicIds.length) return

    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/${client}/cleanup`,
        { previewPublicIds },
        { withCredentials: true }
      )
    )
  }
}
