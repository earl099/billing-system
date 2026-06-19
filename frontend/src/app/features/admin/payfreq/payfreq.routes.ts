/**
 * @fileoverview Admin pay frequency routes
 * Defines routes for pay frequency list and creation pages
 * Protected by auth and role (Admin) guards
 */

import { Route } from "@angular/router";
import { List } from "./list/list";
import { authGuard } from "@guards/auth-guard";
import { roleGuard } from "@guards/role-guard";
import { Create } from "./create/create";

/** Route configuration for admin pay frequency management pages */
export const PAYFREQ_ROUTES: Route[] = [
  { path: 'payfreq/list', component: List, canActivate: [authGuard, roleGuard] },
  { path: 'payfreq/create', component: Create, canActivate: [authGuard, roleGuard] }
]
