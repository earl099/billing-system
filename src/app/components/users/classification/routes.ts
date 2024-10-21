import { Route } from "@angular/router";
import { authGuard } from "../../../shared/authguards/auth.guard";
import { ClassListComponent } from "./class.list/class.list.component";

export const CLASS_ROUTES: Route[] = [
  { path: 'class', component: ClassListComponent, canActivate: [authGuard] }
]
