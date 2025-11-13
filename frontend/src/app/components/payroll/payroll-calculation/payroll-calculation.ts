import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Timekeep } from '@models/timekeep';
import { PayrollService, PayrollEntry } from '@services/payroll.service';
import { Shifts } from '@enums/shifts';

@Component({
  selector: 'app-payroll-calculation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './payroll-calculation.html',
  styleUrl: './payroll-calculation.scss'
})
export class PayrollCalculation {
  uploadedTimekeepData: Timekeep[] = [];
  calculatedPayroll: PayrollEntry[] = [];
  timekeepDisplayedColumns: string[] = ['employeeId', 'date', 'hoursWorked', 'shiftType'];
  payrollDisplayedColumns: string[] = [
    'employeeName',
    'position',
    'department',
    'totalHours',
    'ratePerHour',
    'grossSalary',
    'shiftType'
  ];

  private payrollService = inject(PayrollService)

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.parseCsvFile(file);
    }
  }

  private parseCsvFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = reader.result as string;
      this.uploadedTimekeepData = this.csvToJson(csv);
      console.log('Parsed Timekeep Data for Calculation:', this.uploadedTimekeepData);
    };
    reader.readAsText(file);
  }

  private csvToJson(csv: string): Timekeep[] {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    const result: Timekeep[] = [];

    for (let i = 1; i < lines.length; i++) {
      const obj: any = {};
      const currentline = lines[i].split(',');

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push({
         employeeId: obj['employeeId'] || obj['Employee ID'],
         date: obj['date'] || obj['Date'],
         clockIn: obj['clockIn'] || obj['Clock In'] || '',
         clockOut: obj['clockOut'] || obj['Clock Out'] || '',
         hoursWorked: parseFloat(obj['hoursWorked'] || obj['Hours Worked']),
         shiftType: (obj['shiftType'] || obj['Shift Type']) as Shifts.DAY | Shifts.NIGHT
       });
    }
    return result;
  }

  calculatePayroll(): void {
    if (this.uploadedTimekeepData.length === 0) {
      alert('Please upload timekeeping data first.');
      return;
    }
    this.payrollService.calculatePayroll(this.uploadedTimekeepData).subscribe(
      (payrollEntries) => {
        this.calculatedPayroll = payrollEntries;
        console.log('Calculated Payroll:', this.calculatedPayroll);
      },
      (error) => {
        console.error('Error calculating payroll:', error);
        alert('Error calculating payroll. Check console for details.');
      }
    );
  }
}
