/**
 * @fileoverview Billing rates feature routes
 * Defines navigation routes for billing rate list, create, update, and view pages
 * All routes require authentication via authGuard
 */

import { Route } from "@angular/router";
import { List } from "@rates/list/list";
import { Update } from "@rates/update/update";
import { Create } from "@rates/create/create";
import { View } from "@rates/view/view";
import { authGuard } from "@guards/auth-guard";

/** Route configuration for billing rate management pages */
export const RATES_ROUTES: Route[] = [
  { path: ':code/list', component: List, canActivate: [authGuard] },
  { path: ':code/:index/edit', component: Update, canActivate: [authGuard] },
  { path: ':code/add', component: Create, canActivate: [authGuard] },
  { path: ':code/:index/view', component: View, canActivate: [authGuard] },
]
