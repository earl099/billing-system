import { Route } from "@angular/router";

export const BILLING_ROUTES: Route[] = [
  { path: 'letter', loadChildren: () => import('@billing/letter/letter.routes').then(mod => mod.BILLING_LETTER_ROUTES) },
  { path: ':code', loadChildren: () => import('@billing/operations/operations.routes').then(mod => mod.BILLING_OPERATIONS_ROUTES) },
]
