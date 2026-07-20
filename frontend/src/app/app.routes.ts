/**
 * @fileoverview Application route definitions
 * Defines the top-level lazy-loaded route tree for the Angular application.
 * All feature modules are lazy-loaded for optimal initial bundle size.
 */

import { inject } from '@angular/core';
import { Router, Routes, type CanActivateFn } from '@angular/router';
import { Auth } from '@services/auth';
import { toast } from 'ngx-sonner';

const notFoundGuard: CanActivateFn = () => {
  const auth = inject(Auth)
  const router = inject(Router)

  if (auth.hasValidToken()) {
    toast.error('Page does not exist')
    router.navigate(['/dashboard'])
  } else {
    router.navigate(['/home'])
  }
  return false
}

/**
 * Root route configuration with lazy-loaded feature modules:
 * - '' (root): Public pages (home, login, signup, dashboard)
 * - 'admin': Admin management (users, logs, payfreq, clients) - combines multiple sub-routes
 * - 'billing': Billing letter editor and operations
 * - 'manpower': Employee management
 * - 'rates': Billing rate management
 * - '**': Wildcard redirect to home
 */
export const routes: Routes = [
  { path: '', loadChildren: () => import('@pages/pages.routes').then(mod => mod.INDEX_ROUTES) },
  {
    path: 'admin',
    loadChildren: () => Promise.all([
      import('@admin/user/user.routes').then(mod => mod.USER_ROUTES),
      import('@admin/log/log.routes').then(mod => mod.LOG_ROUTES),
      import('@admin/payfreq/payfreq.routes').then(mod => mod.PAYFREQ_ROUTES),
      import('@admin/client/client.routes').then(mod => mod.CLIENT_ROUTES),
      import('@admin/backup/backup.routes').then(mod => mod.BACKUP_ROUTES)
    ]).then(([userRoutes, logRoutes, payfreqRoutes, clientRoutes, backupRoutes]) =>
      [...userRoutes, ...logRoutes, ...payfreqRoutes, ...clientRoutes, ...backupRoutes]
    )
  },
  { path: 'billing', loadChildren: () => import('@billing/billing.routes').then(mod => mod.BILLING_ROUTES) },
  { path: 'manpower', loadChildren: () => import('@manpower/manpower.routes').then(mod => mod.MANPOWER_ROUTES) },
  { path: 'rates', loadChildren: () => import('@rates/rates.routes').then(mod => mod.RATES_ROUTES) },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
