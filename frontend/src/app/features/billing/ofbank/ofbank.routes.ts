import { Route } from '@angular/router';
import { authGuard } from '@guards/auth-guard';
import { ManpowerBilling } from './manpower-billing/manpower-billing';

export const OFBANK_ROUTES: Route[] = [
  { path: 'create/manpower', component: ManpowerBilling, canActivate: [authGuard] },
]
