import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('@pages/pages.routes').then(mod => mod.INDEX_ROUTES) },
  {
    path: 'admin',
    loadChildren: () => Promise.all([
      import('@admin/user/user.routes').then(mod => mod.USER_ROUTES),
      import('@admin/log/log.routes').then(mod => mod.LOG_ROUTES),
      import('@admin/payfreq/payfreq.routes').then(mod => mod.PAYFREQ_ROUTES),
      import('@admin/client/client.routes').then(mod => mod.CLIENT_ROUTES)
    ]).then(([userRoutes, logRoutes, payfreqRoutes, clientRoutes]) =>
      [...userRoutes, ...logRoutes, ...payfreqRoutes, ...clientRoutes]
    )
  },
  { path: 'billing', loadChildren: () => import('@billing/billing.routes').then(mod => mod.BILLING_ROUTES) },
  { path: 'manpower', loadChildren: () => import('@manpower/manpower.routes').then(mod => mod.MANPOWER_ROUTES) },
  { path: 'rates', loadChildren: () => import('@rates/rates.routes').then(mod => mod.RATES_ROUTES) },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
