/**
 * @fileoverview Admin client management routes
 * Defines CRUD routes for client organizations, protected by auth and role guards
 */

import { Route } from "@angular/router";
import { List } from "./list/list";
import { authGuard } from "@guards/auth-guard";
import { roleGuard } from "@guards/role-guard";
import { Create } from "./create/create";
import { View } from "./view/view";
import { Update } from "./update/update";

/** Route configuration for admin client management pages */
export const CLIENT_ROUTES: Route[] = [
  { path: 'client/list', component: List, canActivate: [authGuard, roleGuard] },
  { path: 'client/create', component: Create, canActivate: [authGuard, roleGuard] },
  { path: 'client/:id', component: View, canActivate: [authGuard, roleGuard] },
  { path: 'client/:id/edit', component: Update, canActivate: [authGuard, roleGuard] },
]
