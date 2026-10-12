/**
 * @fileoverview Billing detail view component
 * Displays a single billing record with download capability for the final merged PDF
 */

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MATERIAL_MODULES } from '@material';
import { Billing } from '@services/billing';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-view',
  imports: [...MATERIAL_MODULES, MatIconModule, RouterLink],
  templateUrl: './view.html',
  styleUrl: './view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class View implements OnInit {
  private readonly route = inject(ActivatedRoute)
  readonly router = inject(Router)
  private readonly billingService = inject(Billing)

  readonly billing = signal<any | null>(null)
  readonly loading = signal(true)
  readonly loadError = signal<string | null>(null)
  readonly downloading = signal(false)
  readonly code = signal(this.route.snapshot.paramMap.get('code') ?? '')
  readonly recordId = this.route.snapshot.paramMap.get('_id') ?? ''

  /** Loads billing record details and parses the creation date */
  async ngOnInit(): Promise<void> {
    if (!this.recordId || !this.code()) {
      this.loading.set(false)
      this.loadError.set('This billing record could not be identified.')
      return
    }
    await this.load()
  }

  async load(): Promise<void> {
    this.loading.set(true)
    this.loadError.set(null)
    try {
      const record = await this.billingService.billingDetails(this.recordId, this.code())
      if (!record) throw new Error('Billing record not found')
      this.billing.set(record)
    } catch {
      this.billing.set(null)
      this.loadError.set('We could not load this billing record. Please try again.')
    } finally {
      this.loading.set(false)
    }
  }

  /** Downloads the final merged PDF from Cloudinary */
  async downloadFinalPdf(): Promise<void> {
    const url = this.billing()?.finalPdf?.secure_url
    if (!url || this.downloading()) {
      toast.error('The final PDF is not available for download.')
      return
    }

    this.downloading.set(true)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = this.billing()?.finalPdf?.original_filename || 'ACID-Billing.pdf'
      link.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error('Unable to download the final PDF. Please try again.')
    } finally {
      this.downloading.set(false)
    }
  }

  formattedDate(value: unknown): string {
    const date = value ? new Date(String(value)) : null
    return date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
      : 'Not recorded'
  }
}
