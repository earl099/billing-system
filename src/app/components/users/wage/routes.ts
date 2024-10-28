import { Route } from "@angular/router";
import { authGuard } from "../../../shared/authguards/auth.guard";
import { WageListComponent } from "./wage.list/wage.list.component";

export const WAGE_ROUTES: Route[] = [
  { path: 'wages', component: WageListComponent, canActivate: [authGuard] }
]
