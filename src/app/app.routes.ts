import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: '', loadChildren: () => import('./components/index/routes').then(mod => mod.INDEX_ROUTES) },
  { path: '', loadChildren: () => import('./components/admin/account/routes').then(mod => mod.ACCOUNT_ROUTES) },
  { path: '', loadChildren: () => import('./components/admin/pay-freq/routes').then(mod => mod.PAYFREQ_ROUTES) },
  { path: '', loadChildren: () => import('./components/users/client/routes').then(mod => mod.CLIENT_ROUTES) },
  { path: '', loadChildren: () => import('./components/users/classification/routes').then(mod => mod.CLASS_ROUTES) },
  { path: '', loadChildren: () => import('./components/users/department/routes').then(mod => mod.DEPT_ROUTES) },
  { path: '', loadChildren: () => import('./components/users/wage/routes').then(mod => mod.WAGE_ROUTES) },
  { path: '', loadChildren: () => import('./components/users/location/routes').then(mod => mod.LOCATION_ROUTES) },
  { path: '', loadChildren: () => import('./components/users/position/routes').then(mod => mod.POSITION_ROUTES) }
];
