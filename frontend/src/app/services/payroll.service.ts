import { inject, Injectable } from '@angular/core';
import { EmployeeService } from './employee.service';
import { ConfigService } from './config.service';
import { Timekeep } from '../models/timekeep';
import { Observable, of } from 'rxjs';
import { Shifts } from '../enums/shifts';

export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  totalHours: number;
  ratePerHour: number;
  grossSalary: number;
  shiftType: Shifts | 'N/A';
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private employeeService = inject(EmployeeService)
  private configService = inject(ConfigService)

  calculatePayroll(timekeepData: Timekeep[]): Observable<PayrollEntry[]> {
    const employees = this.employeeService.mockEmployees; // Access mock data directly for now
    const billingRates = this.configService.getBillingRates() || [];

    const payrollEntries: PayrollEntry[] = [];

    // Group timekeep data by employee
    const timekeepByEmployee = timekeepData.reduce((acc, entry) => {
      (acc[entry.employeeId] = acc[entry.employeeId] || []).push(entry);
      return acc;
    }, {} as { [employeeId: string]: Timekeep[] });

    for (const employeeId in timekeepByEmployee) {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        console.warn(`Employee with ID ${employeeId} not found.`);
        continue;
      }

      const employeeTimekeep = timekeepByEmployee[employeeId];
      let totalHours = 0;
      let effectiveShiftType: Shifts | 'N/A' = 'N/A';

      employeeTimekeep.forEach(entry => {
        totalHours += entry.hoursWorked;
        // Determine effective shift type (simplified for now, could be more complex)
        if (employee.department === 'Operations') {
          effectiveShiftType = entry.shiftType; // Use timekeep entry's shift type for operations
        } else {
          effectiveShiftType = employee.shift; // Use employee's default shift for non-operations
        }
      });

      const applicableRate = billingRates.find(rate =>
        rate.position === employee.position && rate.department === employee.department
        // Add date-based logic for effectiveDate if needed
      );

      let ratePerHour = applicableRate ? applicableRate.ratePerHour : 0;

      // Apply night shift differential if applicable (example logic)
      if (employee.department === 'Operations' && effectiveShiftType !== 'N/A' && effectiveShiftType === Shifts.NIGHT) {
        ratePerHour *= 1.1; // 10% night shift differential
      }

      const grossSalary = totalHours * ratePerHour;

      payrollEntries.push({
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        department: employee.department,
        totalHours: totalHours,
        ratePerHour: ratePerHour,
        grossSalary: grossSalary,
        shiftType: effectiveShiftType
      });
    }

    return of(payrollEntries);
  }
}
