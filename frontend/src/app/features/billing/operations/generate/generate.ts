/**
 * @fileoverview Billing generation component
 * Handles uploading billing letters and attachments, previewing as PDFs,
 * merging into a final PDF, and downloading the result.
 * Cleans up preview files on navigation away or page unload.
 */

import { ChangeDetectionStrategy, Component, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@env/environment';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Billing } from '@services/billing';
import { Log } from '@services/log';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'acid-generate',
  imports: [...MATERIAL_MODULES],
  templateUrl: './generate.html',
  styleUrl: './generate.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Generate implements OnDestroy {
  route = inject(ActivatedRoute)

  code = signal(this.route.snapshot.paramMap.get('code')!)
  billingLetter = signal<File | null>(null);
  attachments = signal<File[]>([]);
  previews = signal<{ label: string, safeUrl: SafeResourceUrl, public_id: string }[]>([])
  mode = signal<'preview' | 'direct' | null>(null)
  isPreviewClicked = signal(false)
  loading = signal(false);
  downloadUrl = signal<string | null>(null);
  finalFileName = signal<string>(`${this.code().toUpperCase()}-Billing.pdf`)
  /** Flag to prevent duplicate cleanup calls */
  private cleanedUp = false

  /** Sends cleanup beacon on page unload to delete orphaned preview files */
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event) {
    const ids = this.previews().map((p: any) => p.public_id)

    if(!ids.length) return

    navigator.sendBeacon(
      `${environment.apiUrl}/billing/${this.code().toLowerCase()}/cleanup`,
      JSON.stringify({ previewPublicIds: ids })
    )
  }

  billingService = inject(Billing)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)
  sanitizer = inject(DomSanitizer)

  /** Handles billing letter file selection */
  selectBillingLetter(e: any) { this.billingLetter.set(e.target.files[0]) }
  /** Handles attachment files selection */
  selectAttachments(e: any) { this.attachments.set([...e.target.files]) }

  /** Uploads billing letter and attachments for PDF preview */
  async preview() {
    if(!this.billingLetter()) return alert('Billing Letter required');

    const fd = new FormData
    fd.append('billingLetter', this.billingLetter()!)
    this.attachments().forEach(f => fd.append('attachments', f))
    fd.append('previewPublicIds', JSON.stringify(this.previews().map((p: any) => p.public_id)))

    this.isPreviewClicked.set(true)
    this.loading.set(true)
    this.mode.set('preview')
    this.previews.set(await this.billingService.billingPreview(this.code(), fd))
    this.loading.set(false)
  }

  /** Generates the final merged billing PDF and provides download URL */
  async generate() {
    if(!this.billingLetter()) return alert('Billing Letter required')
    if(!confirm('Are you sure you want to generate this Billing?')) return

    try {
      this.isPreviewClicked.set(false)
      this.loading.set(true)

      const formData = new FormData
      formData.append('billingLetter', this.billingLetter()!)
      this.attachments().forEach(f => formData.append('attachments', f))

      const previewPublicIds = this.previews()
      .map((p: any) => p.public_id)
      .filter((id: any) => typeof id === 'string' && id.length);
      const previewUrls = this.previews()
      .map((p: any) => p.url)
      .filter((url: any) => typeof url === 'string' && url.startsWith('https://'));

      formData.append('previewPublicIds', JSON.stringify(previewPublicIds))
      formData.append('previewUrls', JSON.stringify(previewUrls));

      const billing = await this.billingService.billingGenerate(
        this.code(),
        formData,
        previewPublicIds,
        previewUrls,
        this.mode() ?? 'direct'
      )

      this.downloadUrl.set(billing['downloadUrl'])
      this.loading.set(false)

      const logObject: LogDTO = {
        operation: `Generated Billing for ${this.code().toUpperCase()}`
      }

      await this.logService.create(logObject)

      this.finalFileName.set(
        `${this.code().toUpperCase()}-Billing-${new Date().toISOString().slice(0,10)}.pdf`
      )


    } catch (error: any) {
      toast.error('Error: ' + error)
      console.log(error)
    }
  }

  /** Downloads the final merged PDF from Cloudinary */
  async downloadFinalPdf() {
    const url = this.downloadUrl()
    if(!url) return

    const res = await fetch(url)
    const blob = await res.blob()

    const a = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)

    a.href = objectUrl
    a.download = this.finalFileName()
    a.click()

    URL.revokeObjectURL(objectUrl)
  }

  /** Cleans up preview files from Cloudinary on component destroy */
  async ngOnDestroy() {
    await this.cleanupPreviews(this.code())
  }

  /** Deletes temporary preview files from Cloudinary to prevent orphaned uploads */
  private async cleanupPreviews(client: string) {
    if (this.cleanedUp) return;

    const ids = this.previews().map((p: any) => p.public_id);

    if (!ids.length) return;

    try {
      await this.billingService.cleanup(ids, client);
      this.cleanedUp = true;
      console.log('Preview files deleted');
    } catch (error) {
      console.log('Failed to delete preview files', error);
    }
  }
}
