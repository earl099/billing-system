import { Route } from "@angular/router";
import { LogList } from "./log-list/log-list";
import { authGuard } from "@guards/auth-guard";
import { roleGuard } from "@guards/role-guard";
import { LogView } from "./log-view/log-view";

export const LOG_ROUTES: Route[] = [
  { path: 'log/list', component: LogList, canActivate: [authGuard, roleGuard] },
  { path: 'log/:id', component: LogView, canActivate: [authGuard, roleGuard] }
]
