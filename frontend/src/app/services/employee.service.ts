import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Employee } from '@models/employee';
import { Shifts } from '@enums/shifts';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  mockEmployees: Employee[] = [
    { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', department: 'Operations', position: 'Agent', shift: Shifts.DAY },
    { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', department: 'HR', position: 'HR Manager', shift: Shifts.DAY },
    { id: '3', firstName: 'Peter', lastName: 'Jones', email: 'peter.jones@example.com', department: 'Operations', position: 'Team Lead', shift: Shifts.NIGHT },
  { id: '4', firstName: 'Alice', lastName: 'Williams', email: 'alice.williams@example.com', department: 'Billing', position: 'Billing Specialist', shift: Shifts.DAY },
  ];

  constructor() { }

  getEmployees(): Observable<Employee[]> {
    return of(this.mockEmployees);
  }

  getEmployeeById(id: string): Observable<Employee | undefined> {
    return of(this.mockEmployees.find(emp => emp.id === id));
  }
}
