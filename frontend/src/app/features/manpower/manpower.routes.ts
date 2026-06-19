/**
 * @fileoverview Manpower feature routes
 * Defines navigation routes for employee list, create, update, and view pages
 * All routes require authentication via authGuard
 */

import { Route } from "@angular/router";
import { List } from "@manpower/list/list";
import { Update } from "@manpower/update/update";
import { Create } from "@manpower/create/create";
import { View } from "@manpower/view/view";
import { authGuard } from "@guards/auth-guard";

/** Route configuration for manpower/employee management pages */
export const MANPOWER_ROUTES: Route[] = [
  { path: ':code/list', component: List, canActivate: [authGuard] },
  { path: ':code/:index/edit', component: Update, canActivate: [authGuard] },
  { path: ':code/add', component: Create, canActivate: [authGuard] },
  { path: ':code/:index/view', component: View, canActivate: [authGuard] },
]
