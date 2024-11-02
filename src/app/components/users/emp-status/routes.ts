import { Route } from "@angular/router";
import { authGuard } from "../../../shared/authguards/auth.guard";
import { EmpStatusListComponent } from "./emp.status.list/emp.status.list.component";

export const EMP_STATUS_ROUTES: Route[] = [
    { path: 'emp-status', component: EmpStatusListComponent, canActivate: [authGuard] }
]