import { Shifts } from "../enums/shifts";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  shift: Shifts;
  // Add other employee-related fields as needed
}
