/**
 * @fileoverview Backup & Restore component
 * Admin-only page for downloading a full database backup or restoring from one.
 */

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { MATERIAL_MODULES } from '@material';
import { Backup, BackupRestoreResult } from '@services/backup';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-backup',
  imports: [
    ...MATERIAL_MODULES,
    KeyValuePipe
  ],
  templateUrl: './backup.component.html',
  styleUrl: './backup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackupComponent {
  private backupService = inject(Backup)

  /** Whether an export/import operation is in progress */
  loading = signal(false)
  /** The JSON file selected for restore */
  selectedFile = signal<File | null>(null)
  /** Summary returned by the last restore operation */
  lastResult = signal<BackupRestoreResult | null>(null)

  /**
   * Triggers a browser download of the full database backup.
   */
  async onExport() {
    this.loading.set(true)
    try {
      await this.backupService.export()
      toast.success('Backup downloaded successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download backup'
      toast.error(message)
    } finally {
      this.loading.set(false)
    }
  }

  /**
   * Stores the JSON file selected by the admin for restore.
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0] ?? null
    this.selectedFile.set(file)
    this.lastResult.set(null)
  }

  /**
   * Uploads the selected backup file and replaces the current database contents.
   * Requires explicit confirmation because restore is destructive.
   */
  async onRestore() {
    const file = this.selectedFile()
    if (!file) {
      toast.error('Please select a backup file')
      return
    }

    if (!confirm('Restoring will replace all current data with the backup contents. This action cannot be undone. Continue?')) {
      return
    }

    this.loading.set(true)
    try {
      const result = await this.backupService.import(file)
      this.lastResult.set(result)
      toast.success('Backup restored successfully')
      this.selectedFile.set(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore backup'
      toast.error(message)
    } finally {
      this.loading.set(false)
    }
  }

  /**
   * Clears the selected file and resets the result summary.
   */
  clearSelection() {
    this.selectedFile.set(null)
    this.lastResult.set(null)
  }

  /**
   * Formats a collection restore result for display.
   */
  formatResult(key: string, value: { restored?: number; skipped?: boolean; reason?: string }): string {
    if (value.skipped) {
      return `${key}: skipped (${value.reason ?? 'not in backup'})`
    }
    return `${key}: ${value.restored ?? 0} records restored`
  }
}
