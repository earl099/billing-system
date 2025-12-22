import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./pages/routes').then(mod => mod.INDEX_ROUTES) },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
