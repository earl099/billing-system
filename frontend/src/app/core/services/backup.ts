/**
 * @fileoverview Backup and restore service
 * Provides admin-only export/import operations against the REST API.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment.prod';
import { firstValueFrom } from 'rxjs';

/** Shape of the restore summary returned by the API */
export interface BackupRestoreResult {
  message: string;
  results: Record<string, { restored?: number; skipped?: boolean; reason?: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class Backup {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  /**
   * Downloads a full database backup as a JSON file.
   * Triggers a browser download named lbs-backup-<timestamp>.json.
   */
  async export(): Promise<void> {
    try {
      const blob = await firstValueFrom(
        this.http.get(`${this.apiUrl}/backup/export`, { responseType: 'blob' })
      )

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `lbs-backup-${timestamp}.json`
      const url = window.URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      throw new Error(`Failed to export backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Uploads a JSON backup file and restores the database.
   * @param file - The backup JSON file selected by the admin
   * @returns Restore summary from the API
   */
  async import(file: File): Promise<BackupRestoreResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await firstValueFrom(
        this.http.post<BackupRestoreResult>(`${this.apiUrl}/backup/import`, formData)
      )

      return res
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
