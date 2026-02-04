import { Route } from "@angular/router";

export const BILLING_ROUTES: Route[] = [
  { path: 'letter', loadChildren: () => import('@billing/letter/letter.routes').then(mod => mod.BILLING_LETTER_ROUTES) },
  { path: 'acid', loadChildren: () => import('@billing/acid/acid.routes').then(mod => mod.ACID_ROUTES) },
]
