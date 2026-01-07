import { Route } from "@angular/router";
import { ClientList } from "./client-list/client-list";
import { authGuard } from "@guards/auth-guard";
import { roleGuard } from "@guards/role-guard";
import { ClientCreate } from "./client-create/client-create";
import { ClientView } from "./client-view/client-view";
import { ClientUpdate } from "./client-update/client-update";

export const CLIENT_ROUTES: Route[] = [
  { path: 'client/list', component: ClientList, canActivate: [authGuard, roleGuard] },
  { path: 'client/create', component: ClientCreate, canActivate: [authGuard, roleGuard] },
  { path: 'client/:id', component: ClientView, canActivate: [authGuard, roleGuard] },
  { path: 'client/:id/edit', component: ClientUpdate, canActivate: [authGuard, roleGuard] },
]
