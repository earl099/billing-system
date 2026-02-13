import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Billing {
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)
  private sanitizer = inject(DomSanitizer)

  //** ACID BILLING STARTS HERE **//
async acidBillingGenerate(
  fd: FormData,
  _previewPublicIds: string[],
  _previewUrls: string[],
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

  console.log(res.previews)

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

async acidBillingList() {
  const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/acid/list`, { withCredentials: true }))
  return res.list
}

async acidBillingDetails(id: string) {
  const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/acid/${id}`, { withCredentials: true }))
  return res.acidBilling
}

async deleteAcidBilling(_id: string) {
  const res: any = await firstValueFrom(this.http.delete(`${this.apiUrl}/acid/${_id}`, { withCredentials: true }))
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
