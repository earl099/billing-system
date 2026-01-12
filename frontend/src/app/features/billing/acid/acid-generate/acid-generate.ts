import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Auth } from '@services/auth';
import { Billing } from '@services/billing';
import { Log } from '@services/log';

@Component({
  selector: 'app-generate',
  imports: [...MATERIAL_MODULES],
  templateUrl: './acid-generate.html',
  styleUrl: './acid-generate.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcidGenerate {
  billingLetter = signal<File | null>(null);
  attachments = signal<File[]>([]);
  previews = signal<{ label: string, url: SafeResourceUrl }[]>([])
  loading = signal(false);
  downloadUrl = signal<string | null>(null);

  billingService = inject(Billing)
  authService = inject(Auth)
  logService = inject(Log)
  router = inject(Router)
  sanitizer = inject(DomSanitizer)

  selectBillingLetter(e: any) { this.billingLetter.set(e.target.files[0]) }
  selectAttachments(e: any) { this.attachments.set([...e.target.files]) }

  async preview() {
    if(!this.billingLetter()) return alert('Billing Letter required');

    this.loading.set(true)
    const res = await this.billingService.acidBillingPreview(
      this.billingLetter()!,
      this.attachments()
    )
    this.previews.set(res.previewFiles.map((p: any) => ({
      label: p.label,
      url: this.sanitizer.bypassSecurityTrustResourceUrl(p.url)
    })))
    this.loading.set(false)
  }

  async submit() {
    if(!this.billingLetter()) return alert('Billing Letter required')
    if(!confirm('Are you sure you want to generate this Billing?')) return

    try {
      this.loading.set(true)
      const billing = await this.billingService.acidBillingGenerate(
        this.billingLetter()!,
        this.attachments()
      )

      this.downloadUrl.set(billing.downloadUrl)
      this.loading.set(false)
    } catch (error) {
      console.log(error)
    }


    //TODO: INPUT LOG FUNCTION HERE
  }
}
