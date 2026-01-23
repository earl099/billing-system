import { ChangeDetectionStrategy, Component, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment } from '@env/environment.prod';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Billing } from '@services/billing';
import { Log } from '@services/log';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-generate',
  imports: [...MATERIAL_MODULES],
  templateUrl: './generate.html',
  styleUrl: './generate.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcidGenerate implements OnDestroy {
  //** SIGNALS TO BE USED **/
  billingLetter = signal<File | null>(null);
  attachments = signal<File[]>([]);
  previews = signal<{ label: string, safeUrl: SafeResourceUrl, public_id: string }[]>([])
  mode = signal<'preview' | 'direct' | null>(null)
  isPreviewClicked = signal(false)
  loading = signal(false);
  downloadUrl = signal<string | null>(null);
  finalFileName = signal<string>('ACID-Billing.pdf')
  private cleanedUp = false

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event) {
    const ids = this.previews().map((p: any) => p.public_id)

    if(!ids.length) return

    navigator.sendBeacon(
      `${environment.apiUrl}/acid/cleanup`,
      JSON.stringify({ previewPublicIds: ids })
    )
  }

  //** SERVICES NEEDED **/
  billingService = inject(Billing)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)
  sanitizer = inject(DomSanitizer)

  //** FILE SELECTION **/
  selectBillingLetter(e: any) { this.billingLetter.set(e.target.files[0]) }
  selectAttachments(e: any) { this.attachments.set([...e.target.files]) }

  //** PREVIEW FUNCTION **/
  async preview() {
    if(!this.billingLetter()) return alert('Billing Letter required');

    const fd = new FormData
    fd.append('billingLetter', this.billingLetter()!)
    this.attachments().forEach(f => fd.append('attachments', f))
    fd.append('previewPublicIds', JSON.stringify(this.previews().map((p: any) => p.public_id)))

    this.isPreviewClicked.set(true)
    this.loading.set(true)
    this.mode.set('preview')
    this.previews.set(await this.billingService.acidBillingPreview(fd))
    this.loading.set(false)
  }

  //** GENERATE FUNCTION **/
  async generate() {
    if(!this.billingLetter()) return alert('Billing Letter required')
    if(!confirm('Are you sure you want to generate this Billing?')) return

    try {
      this.isPreviewClicked.set(false)
      this.loading.set(true)

      const formData = new FormData
      formData.append('billingLetter', this.billingLetter()!)
      this.attachments().forEach(f => formData.append('attachments', f))

      const previewPublicIds = this.previews().map((p: any) => p.public_id);
      const previewUrls = this.previews().map((p: any) => p.url);

      formData.append('previewPublicIds', JSON.stringify(previewPublicIds))
      formData.append('previewUrls', JSON.stringify(previewUrls));

      const billing = await this.billingService.acidBillingGenerate(
        formData,
        previewPublicIds,
        previewUrls,
        this.mode() ?? 'direct'
      )

      this.downloadUrl.set(billing.downloadUrl)
      this.loading.set(false)

      const user = signal(await this.authService.getProfile())
      const logObject: LogDTO = {
        user: user().name,
        operation: 'Generated Billing for ACID'
      }

      await this.logService.create(logObject)

      this.finalFileName.set(
        `ACID-Billing-${new Date().toISOString().slice(0,10)}.pdf`
      )


    } catch (error: any) {
      toast.error('Error: ' + error)
      console.log(error)
    }
  }

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

  async ngOnDestroy() {
    await this.cleanupPreviews('acid')
  }

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
