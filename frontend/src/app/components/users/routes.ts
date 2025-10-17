import { Route } from "@angular/router";
import { ClientComponent } from "./client/client.component";
import { authGuard } from "@shared/guards/auth.guard";

export const USER_ROUTES: Route[] = [
    { path: 'clients',  component: ClientComponent, canActivate: [authGuard] }
]