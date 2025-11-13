import { Routes } from '@angular/router';
import { Settings } from './components/admin/settings/settings';
import { EmployeeList } from './components/hr/employee-list/employee-list';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: 'employees', component: EmployeeList },
  { path: 'payroll', loadChildren: () => import('./components/payroll/payroll-module').then(mod => mod.PayrollModule) },
  { path: '', loadChildren: () => import('./components/index/routes').then(mod => mod.INDEX_ROUTES) },
  { path: '', loadChildren: () => import('./components/admin/routes').then(mod => mod.ACCOUNT_ROUTES) },
  { path: '', loadChildren: () => import('./components/users/routes').then(mod => mod.USER_ROUTES)}
];
