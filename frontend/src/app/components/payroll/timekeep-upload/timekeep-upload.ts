import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Timekeep } from '../../../models/timekeep';
import { Shifts } from '../../../enums/shifts';

@Component({
  selector: 'app-timekeep-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './timekeep-upload.html',
  styleUrl: './timekeep-upload.scss'
})
export class TimekeepUpload {
  uploadedTimekeepData: Timekeep[] = [];
  displayedColumns: string[] = ['employeeId', 'date', 'clockIn', 'clockOut', 'hoursWorked', 'shiftType'];

  constructor() { }

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
      console.log('Parsed Timekeep Data:', this.uploadedTimekeepData);
    };
    reader.readAsText(file);
  }

  private calculateShiftDetails(clockIn: string, clockOut: string): { hoursWorked: number, shiftType: Shifts } {
    const clockInTime = new Date(`1970-01-01T${clockIn}:00`);
    const clockOutTime = new Date(`1970-01-01T${clockOut}:00`);

    let diff = clockOutTime.getTime() - clockInTime.getTime();
    if (diff < 0) {
      // Assume the shift crossed midnight
      const midnight = new Date(`1970-01-02T00:00:00`);
      diff = (midnight.getTime() - clockInTime.getTime()) + (clockOutTime.getTime() - new Date(`1970-01-01T00:00:00`).getTime());
    }

    const hoursWorked = diff / (1000 * 60 * 60);

    const dayShiftStart = new Date(`1970-01-01T06:00:00`).getTime();
    const dayShiftEnd = new Date(`1970-01-01T18:00:00`).getTime();

    let shiftType: Shifts;
    if (clockInTime.getTime() >= dayShiftStart && clockOutTime.getTime() <= dayShiftEnd) {
      shiftType = Shifts.DAY;
    } else {
      shiftType = Shifts.NIGHT;
    }

    return { hoursWorked: parseFloat(hoursWorked.toFixed(2)), shiftType };
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

      const clockIn = obj['clockIn'] || obj['Clock In'];
      const clockOut = obj['clockOut'] || obj['Clock Out'];
      const { hoursWorked, shiftType } = this.calculateShiftDetails(clockIn, clockOut);

      result.push({
        employeeId: obj['employeeId'] || obj['Employee ID'],
        date: obj['date'] || obj['Date'],
        clockIn,
        clockOut,
        hoursWorked,
        shiftType
      });
    }
    return result;
  }
}