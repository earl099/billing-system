import { Route } from '@angular/router';
import { authGuard } from '@guards/auth-guard';
import { CoBilling } from './co-billing/co-billing';
import { IvaBilling } from './iva-billing/iva-billing';

export const DEPDEV_ROUTES: Route[] = [
  { path: 'create/co', component: CoBilling, canActivate: [authGuard] },
  { path: 'create/iva', component: IvaBilling, canActivate: [authGuard] },
]