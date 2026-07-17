/**
 * Billing service
 * Handles billing letter generation, PDF preview/upload, download, listing, and cleanup operations
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '@env/environment.prod';
import { firstValueFrom } from 'rxjs';

/** Response shape from billing generation endpoint */
interface BillingGenerateResponse {
  [key: string]: any;
}

/** Response shape from billing preview endpoint */
interface BillingPreviewResponse {
  previews: Array<{ public_id: string; url: string; label: string }>;
}

/** Response shape from billing list endpoint */
interface BillingListResponse {
  list: any[];
}

/** Response shape from billing details endpoint */
interface BillingDetailsResponse {
  billing: any;
}

/** Preview item with sanitized URL for safe iframe/embed display */
interface PreviewItem {
  /** Cloudinary public ID for the uploaded preview */
  public_id: string;
  /** Original Cloudinary URL */
  rawUrl: string;
  /** Angular SafeResourceUrl for use in iframes */
  safeUrl: any;
  /** Display label for the preview */
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class Billing {
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient)
  private sanitizer = inject(DomSanitizer)

  /**
   * Generates a final merged billing PDF
   * Combines billing letter and attachments into a single PDF uploaded to Cloudinary
   * 
   * @param code - Client code
   * @param fd - FormData containing billing letter and attachment files
   * @param _previewPublicIds - Cloudinary public IDs of previews to clean up after generation
   * @param _previewUrls - URLs of preview files used for merging
   * @param mode - Generation mode: 'preview' or 'direct'
   * @returns Generation response with billing ID and download URL
   */
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

  /**
   * Uploads billing letter and attachments for preview
   * Converts files to PDF and returns sanitized Cloudinary URLs for display
   * 
   * @param code - Client code
   * @param formData - FormData containing billing letter and attachment files
   * @returns Array of preview items with sanitized URLs for safe embedding
   */
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

  /**
   * Downloads a billing PDF from Cloudinary and triggers a browser download
   * 
   * @param publicId - Cloudinary public ID of the PDF to download
   * @param code - Client code for the API route
   */
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

  /**
   * Fetches paginated list of billing records for a client
   * 
   * @param code - Client code
   * @returns Array of billing records
   */
  async billingList(code: string): Promise<any[]> {
    try {
      const res = await firstValueFrom(this.http.get<BillingListResponse>(`${this.apiUrl}/billing/${code}/list`))
      return res.list
    } catch (error) {
      throw new Error(`Failed to fetch billing list: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetches details of a single billing record
   * 
   * @param id - Billing record MongoDB ID
   * @param code - Client code
   * @returns Billing record with populated creator info
   */
  async billingDetails(id: string, code: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.get<BillingDetailsResponse>(`${this.apiUrl}/billing/${code}/${id}`))
      return res.billing
    } catch (error) {
      throw new Error(`Failed to fetch billing details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deletes a billing record by ID
   * 
   * @param _id - Billing record MongoDB ID
   * @param code - Client code
   * @returns Deletion confirmation response
   */
  async deleteBilling(_id: string, code: string): Promise<any> {
    try {
      const res = await firstValueFrom(this.http.delete<any>(`${this.apiUrl}/billing/${code}/${_id}`))
      return res
    } catch (error) {
      throw new Error(`Delete billing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Cleans up temporary preview files from Cloudinary
   * Called when user cancels billing generation to remove orphaned preview uploads
   * 
   * @param previewPublicIds - Array of Cloudinary public IDs to delete
   * @param client - Client code for the API route
   */
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
