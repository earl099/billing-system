import { Route } from "@angular/router";
import { ClientComponent } from "./client/client.list.component";
import { authGuard } from "@shared/guards/auth.guard";

export const USER_ROUTES: Route[] = [
    { path: 'clients',  component: ClientComponent, canActivate: [authGuard] }
]