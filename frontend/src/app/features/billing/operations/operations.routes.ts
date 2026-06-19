/**
 * @fileoverview Billing operations routes
 * Defines routes for billing generation, list, and detail view pages
 * Protected by authGuard
 */

import { Route } from "@angular/router";
import { authGuard } from "@guards/auth-guard";
import { Generate } from "./generate/generate";
import { List } from "./list/list";
import { View } from "./view/view";

/** Route configuration for billing operations pages */
export const BILLING_OPERATIONS_ROUTES: Route[] = [
  { path: 'generate', component: Generate, canActivate: [authGuard] },
  { path: 'list', component: List, canActivate: [authGuard] },
  { path: 'view/:_id', component: View, canActivate: [authGuard] }
]
