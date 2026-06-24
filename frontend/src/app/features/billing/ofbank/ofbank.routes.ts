import { Route } from '@angular/router';
import { authGuard } from '@guards/auth-guard';
import { ManpowerBilling } from './manpower-billing/manpower-billing';
import { MonthlySuppliesBilling } from './monthly-supplies-billing/monthly-supplies-billing';

export const OFBANK_ROUTES: Route[] = [
  { path: 'create/manpower', component: ManpowerBilling, canActivate: [authGuard] },
  { path: 'create/monthly-supplies', component: MonthlySuppliesBilling, canActivate: [authGuard] },
]
