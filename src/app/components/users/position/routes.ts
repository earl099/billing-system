import { Route } from "@angular/router";
import { authGuard } from "../../../shared/authguards/auth.guard";
import { PositionListComponent } from "./position.list/position.list.component";

export const POSITION_ROUTES: Route[] = [
  { path: 'positions', component: PositionListComponent, canActivate: [authGuard] }
]
