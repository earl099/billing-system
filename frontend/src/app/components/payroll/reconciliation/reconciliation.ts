import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Accrual } from '@models/accrual';
import { BillingData } from '@models/billing-data';
import { GoogleSheetsService } from '@services/google-sheets.service';
import { PayrollEntry } from '@services/payroll.service'; // Assuming we can get calculated payroll
import { ConfigService } from '@services/config.service';
import { Shifts } from '@enums/shifts';

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './reconciliation.html',
  styleUrl: './reconciliation.scss'
})
export class Reconciliation {
  uploadedAccruals: Accrual[] = [];
  uploadedBillingData: BillingData[] = [];
  mismatches: string[] = []; // To store descriptions of mismatches

  private googleSheetsService = inject(GoogleSheetsService)
  private configService = inject(ConfigService)

  // Placeholder for calculated payroll data (would come from PayrollService)
  // For now, we'll use a simple mock or assume it's available
  mockCalculatedPayroll: PayrollEntry[] = [
    { employeeId: '1', employeeName: 'John Doe', position: 'Agent', department: 'Operations', totalHours: 160, ratePerHour: 10, grossSalary: 1600, shiftType: Shifts.DAY },
    { employeeId: '3', employeeName: 'Peter Jones', position: 'Team Lead', department: 'Operations', totalHours: 160, ratePerHour: 16.5, grossSalary: 2640, shiftType: Shifts.NIGHT },
  ];

  accrualsDisplayedColumns: string[] = ['employeeId', 'type', 'amount', 'period'];
  billingDisplayedColumns: string[] = ['clientId', 'employeeId', 'serviceDate', 'hoursBilled', 'rateBilled', 'totalAmount'];
  mismatchesDisplayedColumns: string[] = ['description'];

  onAccrualFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.parseCsvFile(file, 'accrual');
    }
  }

  onBillingFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.parseCsvFile(file, 'billing');
    }
  }

  private parseCsvFile(file: File, type: 'accrual' | 'billing'): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = reader.result as string;
      if (type === 'accrual') {
        this.uploadedAccruals = this.csvToAccrual(csv);
        console.log('Parsed Accruals:', this.uploadedAccruals);
      } else {
        this.uploadedBillingData = this.csvToBillingData(csv);
        console.log('Parsed Billing Data:', this.uploadedBillingData);
      }
    };
    reader.readAsText(file);
  }

  private csvToAccrual(csv: string): Accrual[] {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(header => header.trim());
    const result: Accrual[] = [];
    for (let i = 1; i < lines.length; i++) {
      const obj: any = {};
      const currentline = lines[i].split(',');
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }
      result.push({
        employeeId: obj['employeeId'] || obj['Employee ID'],
        type: obj['type'] || obj['Type'],
        amount: parseFloat(obj['amount'] || obj['Amount']),
        period: obj['period'] || obj['Period']
      });
    }
    return result;
  }

  private csvToBillingData(csv: string): BillingData[] {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(header => header.trim());
    const result: BillingData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const obj: any = {};
      const currentline = lines[i].split(',');
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }
      result.push({
        clientId: obj['clientId'] || obj['Client ID'],
        employeeId: obj['employeeId'] || obj['Employee ID'],
        serviceDate: obj['serviceDate'] || obj['Service Date'],
        hoursBilled: parseFloat(obj['hoursBilled'] || obj['Hours Billed']),
        rateBilled: parseFloat(obj['rateBilled'] || obj['Rate Billed']),
        totalAmount: parseFloat(obj['totalAmount'] || obj['Total Amount'])
      });
    }
    return result;
  }

  runReconciliation(): void {
    this.mismatches = []; // Clear previous mismatches

    if (this.uploadedAccruals.length === 0 || this.uploadedBillingData.length === 0) {
      alert('Please upload both Accruals and Billing Data to run reconciliation.');
      return;
    }

    // Simulate comparison with mock payroll data (DTR)
    // In a real scenario, this would involve fetching actual calculated payroll
    const payrollMap = new Map<string, PayrollEntry>();
    this.mockCalculatedPayroll.forEach(entry => payrollMap.set(entry.employeeId, entry));

    // Example: Check if all employees in payroll have corresponding accruals
    payrollMap.forEach((payrollEntry, employeeId) => {
      const hasAccrual = this.uploadedAccruals.some(acc => acc.employeeId === employeeId);
      if (!hasAccrual) {
        this.mismatches.push(`Employee ${payrollEntry.employeeName} (ID: ${employeeId}) in payroll has no corresponding accrual entry.`);
      }
    });

    // Example: Check if billing data matches payroll hours for operations employees
    this.uploadedBillingData.forEach(billingEntry => {
      const payrollEntry = payrollMap.get(billingEntry.employeeId);
      if (payrollEntry && payrollEntry.department === 'Operations') {
        // Simple check: total hours billed should be close to total hours worked in payroll
        // This would be more sophisticated in a real system
        if (Math.abs(billingEntry.hoursBilled - payrollEntry.totalHours) > 0.1) {
          this.mismatches.push(`Mismatch for Employee ${payrollEntry.employeeName} (ID: ${billingEntry.employeeId}): Billed hours (${billingEntry.hoursBilled}) differ significantly from payroll hours (${payrollEntry.totalHours}).`);
        }
      }
    });

    if (this.mismatches.length === 0) {
      alert('Reconciliation complete: No significant mismatches found!');
    } else {
      alert('Reconciliation complete: Mismatches found. Please review the table below.');
    }
  }

  async inputBalancingToGoogleSheet(): Promise<void> {
    if (!this.googleSheetsService.signedIn.value) {
      alert('Please sign in to Google first in Admin Settings.');
      return;
    }
    const detailsSheetId = 'YOUR_DETAILS_SHEET_ID'; // This should come from ConfigService
    // For now, use a placeholder. User needs to configure this in settings.
    const configuredDetailsSheetId = this.configService.getSpreadsheetId('details'); // Accessing private for demo
    const targetSheetId = configuredDetailsSheetId || detailsSheetId;

    if (!targetSheetId || targetSheetId === 'YOUR_DETAILS_SHEET_ID') {
      alert('Please configure the "Details Sheet ID" in Admin Settings first.');
      return;
    }

    if (this.mismatches.length === 0) {
      alert('No mismatches to balance. Run reconciliation first.');
      return;
    }

    const values = this.mismatches.map(mismatch => [new Date().toISOString(), 'Reconciliation Mismatch', mismatch]);

    try {
      // Assuming 'Details' sheet has columns for Date, Type, Description
      await this.googleSheetsService.updateSheetData(targetSheetId, 'Sheet1!A:C', values);
      alert('Mismatches successfully input into Details Google Sheet!');
      this.mismatches = []; // Clear mismatches after input
    } catch (error) {
      console.error('Error inputting balancing data to Google Sheet:', error);
      alert('Failed to input balancing data to Google Sheet. Check console for details and ensure you have write permissions.');
    }
  }
}
