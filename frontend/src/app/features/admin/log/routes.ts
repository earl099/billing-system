import { Route } from "@angular/router";
import { List } from "./list/list";
import { authGuard } from "@guards/auth-guard";
import { roleGuard } from "@guards/role-guard";
import { View } from "./view/view";

export const LOG_ROUTES: Route[] = [
  { path: 'log/list', component: List, canActivate: [authGuard, roleGuard] },
  { path: 'log/:id', component: View, canActivate: [authGuard, roleGuard] }
]
