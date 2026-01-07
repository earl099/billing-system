import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('@pages/routes').then(mod => mod.INDEX_ROUTES) },
  { path: 'admin', loadChildren: () => import('@admin/user/routes').then(mod => mod.USER_ROUTES) },
  { path: 'admin', loadChildren: () => import('@admin/log/routes').then(mod => mod.LOG_ROUTES) },
  { path: 'admin', loadChildren: () => import('@admin/payfreq/routes').then(mod => mod.PAYFREQ_ROUTES) },
  { path: 'admin', loadChildren: () => import('@admin/client/routes').then(mod => mod.CLIENT_ROUTES) },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
