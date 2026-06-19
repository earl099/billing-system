/**
 * @fileoverview Admin audit log routes
 * Defines routes for viewing audit log list and detail pages
 * Protected by auth and role (Admin) guards
 */

import { Route } from "@angular/router";
import { List } from "./list/list";
import { authGuard } from "@guards/auth-guard";
import { roleGuard } from "@guards/role-guard";
import { View } from "./view/view";

/** Route configuration for admin audit log pages */
export const LOG_ROUTES: Route[] = [
  { path: 'log/list', component: List, canActivate: [authGuard, roleGuard] },
  { path: 'log/:id', component: View, canActivate: [authGuard, roleGuard] }
]
