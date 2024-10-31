import { Route } from "@angular/router";
import { authGuard } from "../../../shared/authguards/auth.guard";
import { EmployeeListComponent } from "./employee.list/employee.list.component";

export const EMPLOYEE_ROUTES: Route[] = [
  { path: 'employees', component: EmployeeListComponent, canActivate: [authGuard] }
]
