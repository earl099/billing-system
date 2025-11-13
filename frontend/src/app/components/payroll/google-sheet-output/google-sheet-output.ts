import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GoogleSheetsService } from '@services/google-sheets.service';
import { ConfigService } from '@services/config.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-google-sheet-output',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule
  ],
  templateUrl: './google-sheet-output.html',
  styleUrl: './google-sheet-output.scss'
})
export class GoogleSheetOutput {
  // Data for Transmittal Sheet
  transmittalData = {
    billingDate: '',
    billingPeriod: '',
    classification: '',
    soaNumber: '',
    grossAmount: 0
  };

  // Data for Account Receivable Sheet
  accountReceivableData = {
    grossBilling: 0,
    receivableDate: '',
    periodCovered: '',
    categories: '',
    soaNumber: ''
  };

  private googleSheetsService = inject(GoogleSheetsService)
  private configService = inject(ConfigService)

  async writeToTransmittalSheet(): Promise<void> {
    if (!this.googleSheetsService.signedIn.value) {
      alert('Please sign in to Google first in Admin Settings.');
      return;
    }

    const transmittalSheetId = this.configService.getSpreadsheetId('transmittal');
    if (!transmittalSheetId || transmittalSheetId === 'YOUR_SAMPLE_API_KEY') { // Check against sample key too
      alert('Please configure the "Transmittal Sheet ID" in Admin Settings first.');
      return;
    }

    const values = [
      [
        this.transmittalData.billingDate,
        this.transmittalData.billingPeriod,
        this.transmittalData.classification,
        this.transmittalData.soaNumber,
        this.transmittalData.grossAmount
      ]
    ];

    try {
      // Assuming 'Sheet1!A:E' is the range for Transmittal data
      await this.googleSheetsService.updateSheetData(transmittalSheetId, 'Sheet1!A:E', values);
      alert('Data successfully written to Transmittal Google Sheet!');
      this.resetTransmittalForm();
    } catch (error) {
      console.error('Error writing to Transmittal Google Sheet:', error);
      alert('Failed to write to Transmittal Google Sheet. Check console for details and ensure valid credentials and permissions.');
    }
  }

  async writeToAccountReceivableSheet(): Promise<void> {
    if (!this.googleSheetsService.signedIn.value) {
      alert('Please sign in to Google first in Admin Settings.');
      return;
    }

    const accountReceivableSheetId = this.configService.getSpreadsheetId('accountReceivable');
    if (!accountReceivableSheetId || accountReceivableSheetId === 'YOUR_SAMPLE_API_KEY') { // Check against sample key too
      alert('Please configure the "Account Receivable Sheet ID" in Admin Settings first.');
      return;
    }

    const values = [
      [
        this.accountReceivableData.grossBilling,
        this.accountReceivableData.receivableDate,
        this.accountReceivableData.periodCovered,
        this.accountReceivableData.categories,
        this.accountReceivableData.soaNumber
      ]
    ];

    try {
      // Assuming 'Sheet1!A:E' is the range for Account Receivable data
      await this.googleSheetsService.updateSheetData(accountReceivableSheetId, 'Sheet1!A:E', values);
      alert('Data successfully written to Account Receivable Google Sheet!');
      this.resetAccountReceivableForm();
    } catch (error) {
      console.error('Error writing to Account Receivable Google Sheet:', error);
      alert('Failed to write to Account Receivable Google Sheet. Check console for details and ensure valid credentials and permissions.');
    }
  }

  resetTransmittalForm(): void {
    this.transmittalData = {
      billingDate: '',
      billingPeriod: '',
      classification: '',
      soaNumber: '',
      grossAmount: 0
    };
  }

  resetAccountReceivableForm(): void {
    this.accountReceivableData = {
      grossBilling: 0,
      receivableDate: '',
      periodCovered: '',
      categories: '',
      soaNumber: ''
    };
  }
}
