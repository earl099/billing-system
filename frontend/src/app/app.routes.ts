import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('@pages/pages.routes').then(mod => mod.INDEX_ROUTES) },
  { path: 'admin', loadChildren: () => import('@admin/user/user.routes').then(mod => mod.USER_ROUTES) },
  { path: 'admin', loadChildren: () => import('@admin/log/log.routes').then(mod => mod.LOG_ROUTES) },
  { path: 'admin', loadChildren: () => import('@admin/payfreq/payfreq.routes').then(mod => mod.PAYFREQ_ROUTES) },
  { path: 'admin', loadChildren: () => import('@admin/client/client.routes').then(mod => mod.CLIENT_ROUTES) },
  { path: 'billing', loadChildren: () => import('@billing/billing.routes').then(mod => mod.BILLING_ROUTES) },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
