import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { LogDTO } from '@models/log';
import { Auth } from '@services/auth';
import { Billing } from '@services/billing';
import { Log } from '@services/log';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-generate',
  imports: [...MATERIAL_MODULES],
  templateUrl: './acid-generate.html',
  styleUrl: './acid-generate.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcidGenerate implements OnDestroy {
  //** SIGNALS TO BE USED **/
  billingLetter = signal<File | null>(null);
  attachments = signal<File[]>([]);
  previews = signal<{ label: string, secure_url: SafeResourceUrl, public_id: string }[]>([])
  loading = signal(false);
  downloadUrl = signal<string | null>(null);

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

    this.loading.set(true)
    const res = await this.billingService.acidBillingPreview(fd)

    this.previews.set(res.previewFiles.map((p: any) => ({
      label: p.label,
      url: this.sanitizer.bypassSecurityTrustResourceUrl(p.secure_url),
      public_id: p.public_id
    })))
    this.loading.set(false)
  }

  //** GENERATE FUNCTION **/
  async generate() {
    if(!this.billingLetter()) return alert('Billing Letter required')
    if(!confirm('Are you sure you want to generate this Billing?')) return

    try {
      this.loading.set(true)

      const formData = new FormData
      formData.append('billingLetter', this.billingLetter()!)
      this.attachments().forEach(f => formData.append('attachments', f))
      formData.append('previewPublicIds', JSON.stringify(this.previews().map((p: any) => p.public_id)))

      const billing = await this.billingService.acidBillingGenerate(formData)

      this.downloadUrl.set(billing.downloadUrl)
      this.loading.set(false)

      const user = signal(await this.authService.getProfile())
      const logObject: LogDTO = {
        user: user().name,
        operation: 'Generated Billing for ACID'
      }

      await this.logService.create(logObject)
    } catch (error: any) {
      toast.error('Error: ' + error)
      console.log(error)
    }
  }

  async ngOnDestroy() {
    if(this.previews().length) {
      await this.billingService.cleanup(
        this.previews().map(p => p.public_id)
      )
    }
  }
}
