import { Route } from "@angular/router";

export const BILLING_ROUTES: Route[] = [
  { path: 'acid', loadChildren: () => import('@billing/acid/acid.routes').then(mod => mod.ACID_ROUTES) },
  
]
