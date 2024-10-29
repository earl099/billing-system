import { Route } from "@angular/router";
import { authGuard } from "../../../shared/authguards/auth.guard";
import { LocationListComponent } from "./location.list/location.list.component";

export const LOCATION_ROUTES: Route[] = [
  { path: 'locations', component: LocationListComponent, canActivate: [authGuard] }
]
