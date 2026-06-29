/**
 * File editor service
 * Handles SharePoint template operations via Microsoft Graph API,
 * including listing templates, creating billing documents from templates, and PDF export
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileEditor {
  private apiUrl = environment.apiUrl
  http = inject(HttpClient)

  /**
   * Fetches available templates for a client from SharePoint
   * 
   * @param code - Client code (lowercased for folder path)
   * @returns Array of template objects with id, name, and type (excel/word)
   */
  async getTemplates(code: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/editor/templates/${code.toLowerCase()}`))
    return res
  }

  /**
   * Creates a billing document from a SharePoint template
   * Copies the template to the client's draft folder, optionally fills in placeholder data,
   * and returns the document ID and edit URL
   * 
   * @param templateId - SharePoint document ID of the source template
   * @param code - Client code for destination folder
   * @param data - Placeholder data for document template rendering
   * @param isBlank - If true, skip data filling and return blank document
   * @param type - Document type: 'word' for DOCX or 'excel' for XLSX (SPAD)
   * @returns Response containing documentId and editUrl
   */
  async createBillingDocument(templateId: string, code: string, data: any, isBlank: boolean, type: 'word' | 'excel') {

    const res: any = await firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/editor/create/${code}/${type}`,
        {
          templateId,
          data,
          isBlank
        }
      )
    )
    return res
  }

  /**
   * Exports a SharePoint document as PDF
   * 
   * @param id - SharePoint document ID to export
   * @returns PDF blob response
   */
  async exportPdf(id: string) {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/editor/export/${id}`, { responseType: 'blob' }))
    return res
  }
}
