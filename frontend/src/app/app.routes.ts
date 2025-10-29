import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: '', loadChildren: () => import('./components/index/routes').then(mod => mod.INDEX_ROUTES) },
  { path: '', loadChildren: () => import('./components/admin/routes').then(mod => mod.ACCOUNT_ROUTES) },
  { path: '', loadChildren: () => import('./components/users/routes').then(mod => mod.USER_ROUTES)}
];
