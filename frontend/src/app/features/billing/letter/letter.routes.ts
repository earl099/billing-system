/**
 * @fileoverview Billing letter editor routes
 * Defines the route for the template-based billing letter editor
 * Protected by authGuard
 */

import { Route } from "@angular/router";
import { Editor } from "./editor/editor";
import { authGuard } from "@guards/auth-guard";

/** Route configuration for billing letter editor */
export const BILLING_LETTER_ROUTES: Route[] = [
  { path: 'editor/:code', component: Editor, canActivate: [authGuard] }
]
