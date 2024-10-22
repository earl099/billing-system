import { Route } from "@angular/router";
import { authGuard } from "../../../shared/authguards/auth.guard";
import { DeptListComponent } from "./dept.list/dept.list.component";

export const DEPT_ROUTES: Route[] = [
  { path: 'depts', component: DeptListComponent, canActivate: [authGuard] }
]
