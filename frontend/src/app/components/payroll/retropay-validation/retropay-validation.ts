import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-retropay-validation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './retropay-validation.html',
  styleUrl: './retropay-validation.scss'
})
export class RetropayValidation {
  selectedFile: File | null = null;
  payslipPreviewUrl: string | ArrayBuffer | null = null;

  retroAdjustment = {
    employeeId: '',
    amount: 0,
    period: '' // e.g., "YYYY-MM" or "YYYY-MM-DD to YYYY-MM-DD"
  };

  constructor() { }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.previewPayslip();
    } else {
      this.selectedFile = null;
      this.payslipPreviewUrl = null;
    }
  }

  private previewPayslip(): void {
    if (!this.selectedFile) {
      this.payslipPreviewUrl = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.payslipPreviewUrl = reader.result;
    };

    // Check file type for appropriate preview
    if (this.selectedFile.type.startsWith('image/')) {
      reader.readAsDataURL(this.selectedFile);
    } else if (this.selectedFile.type === 'application/pdf') {
      // For PDF, we might just show a link or use an iframe,
      // direct preview as image is not straightforward client-side.
      // For now, just store the file name.
      this.payslipPreviewUrl = `File: ${this.selectedFile.name} (PDF)`;
    } else {
      this.payslipPreviewUrl = `File: ${this.selectedFile.name} (Unsupported type for preview)`;
    }
  }

  validateRetropay(): void {
    if (!this.selectedFile || !this.retroAdjustment.employeeId || this.retroAdjustment.amount <= 0 || !this.retroAdjustment.period) {
      alert('Please upload a payslip and fill in all retro adjustment details.');
      return;
    }

    // In a real application, this would involve:
    // 1. Sending the payslip and adjustment details to a backend.
    // 2. Backend processing (OCR on payslip, comparison with timekeeping/payroll records).
    // 3. Returning a validation result.

    // For now, we simulate manual validation.
    alert(`Retropay for Employee ID: ${this.retroAdjustment.employeeId} with amount ${this.retroAdjustment.amount} for period ${this.retroAdjustment.period} has been submitted for manual validation. Payslip: ${this.selectedFile.name}`);

    // Reset form
    this.selectedFile = null;
    this.payslipPreviewUrl = null;
    this.retroAdjustment = { employeeId: '', amount: 0, period: '' };
  }
}
