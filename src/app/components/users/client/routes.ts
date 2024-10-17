import { Route } from "@angular/router";
import { authGuard } from "../../../shared/authguards/auth.guard";
import { ClientListComponent } from "./client.list/client.list.component";

export const CLIENT_ROUTES: Route[] = [
  { path: 'clients', component: ClientListComponent, canActivate: [authGuard] }
]
