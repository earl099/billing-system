/**
 * @fileoverview Billing feature routes
 * Lazy-loads billing letter editor and billing operations sub-routes
 */

import { Route } from "@angular/router";

/** Route configuration for billing feature with lazy-loaded children */
export const BILLING_ROUTES: Route[] = [
  { path: 'letter', loadChildren: () => import('@billing/letter/letter.routes').then(mod => mod.BILLING_LETTER_ROUTES) },
  { path: 'soa', loadChildren: () => import('@billing/soa/soa.routes').then(mod => mod.SOA_ROUTES) },
  { path: 'soa/ofbank', loadChildren: () => import('@billing/ofbank/ofbank.routes').then(mod => mod.OFBANK_ROUTES) },
  { path: 'soa/btr', loadChildren: () => import('@billing/btr/btr.routes').then(mod => mod.BTR_ROUTES) },
  { path: 'btr', loadChildren: () => import('@billing/btr/btr.routes').then(mod => mod.BTR_ROUTES) },
  { path: ':code', loadChildren: () => import('@billing/operations/operations.routes').then(mod => mod.BILLING_OPERATIONS_ROUTES) },
]
