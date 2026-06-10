import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

interface BillingGenerateResponse {
  [key: string]: any;
}

interface BillingPreviewResponse {
  previews: Array<{ public_id: string; url: string; label: string }>;
}

interface BillingListResponse {
  list: any[];
}

interface BillingDetailsResponse {
  billing: any;
}

interface PreviewItem {
  public_id: string;
  rawUrl: string;
  safeUrl: any;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class Billing {
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)
  private sanitizer = inject(DomSanitizer)

  async billingGenerate(
    code: string,
    fd: FormData,
    _previewPublicIds: string[],
    _previewUrls: string[],
    mode: 'preview' | 'direct'
  ): Promise<BillingGenerateResponse> {
    try {
      fd.append('mode', mode)
      const res = await firstValueFrom(
        this.http.post<BillingGenerateResponse>(`${this.apiUrl}/billing/${code}/generate`, fd))
      return res
    } catch (error) {
      throw new Error(`Billing generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async billingPreview(code: string, formData: FormData): Promise<PreviewItem[]> {
    try {
      const res = await firstValueFrom(
        this.http.post<BillingPreviewResponse>(
          `${this.apiUrl}/billing/${code}/preview`,
          formData
        )
      )

      return res.previews.map((p) => ({
        public_id: p.public_id,
        rawUrl: p.url,
        safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(p.url),
        label: p.label
      }))
    } catch (error) {
      throw new Error(`Billing preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async download(publicId: string, code: string): Promise<void> {
    try {
      const blob = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/billing/${code}/download/${encodeURIComponent(publicId)}`,
          { responseType: 'blob' }
        )
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = publicId.split('/').pop() + '.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async billingList(code: string): Promise<any[]> {
    try {
      const res = await firstValueFrom(this.http.get<BillingListResponse>(`${this.apiUrl}/billing/${code}/list`))
      return res.list
    } catch (error) {
      throw new Error(`Failed to fetch billing list: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async billingDetails(id: string, code: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.get<BillingDetailsResponse>(`${this.apiUrl}/billing/${code}/${id}`))
      return res.billing
    } catch (error) {
      throw new Error(`Failed to fetch billing details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteBilling(_id: string, code: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.delete<any>(`${this.apiUrl}/billing/${code}/${_id}`))
      return res
    } catch (error) {
      throw new Error(`Delete billing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async cleanup(previewPublicIds: string[], client: string): Promise<void> {
    try {
      if(!previewPublicIds.length) return

      await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/billing/${client}/cleanup`,
          { previewPublicIds }
        )
      )
    } catch (error) {
      throw new Error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
