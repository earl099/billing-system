import { Shifts } from "../enums/shifts";

export interface Timekeep {
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:mm
  clockOut: string; // HH:mm
  hoursWorked: number;
  shiftType: Shifts; // Derived from employee schedule or time data
  // Add other relevant timekeeping fields
}
