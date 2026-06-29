import { Route } from '@angular/router';
import { authGuard } from '@guards/auth-guard';
import { MissBilling } from './miss-billing/miss-billing';
import { JanitorialBilling } from './janitorial-billing/janitorial-billing';
import { SuppliesBilling } from './supplies-billing/supplies-billing';

export const BTR_ROUTES: Route[] = [
  { path: 'create/miss', component: MissBilling, canActivate: [authGuard] },
  { path: 'create/janitorial', component: JanitorialBilling, canActivate: [authGuard] },
  { path: 'create/supplies', component: SuppliesBilling, canActivate: [authGuard] },
]
