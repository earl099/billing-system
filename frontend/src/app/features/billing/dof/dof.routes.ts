import { Route } from '@angular/router'
import { authGuard } from '@guards/auth-guard'
import { DofBillingComponent } from './dof-billing/dof-billing'
import { DofTimekeepingComponent } from './dof-timekeeping/dof-timekeeping'

export const DOF_ROUTES: Route[] = [
  { path: '', redirectTo: 'timekeeping', pathMatch: 'full' },
  { path: 'timekeeping', component: DofTimekeepingComponent, canActivate: [authGuard] },
  { path: 'billing', component: DofBillingComponent, canActivate: [authGuard] },
  { path: 'create', redirectTo: 'timekeeping' },
]
