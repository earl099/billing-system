/**
 * @fileoverview Backup & Restore routes
 * Defines the admin-only route for the backup and restore page.
 */

import { Route } from '@angular/router';
import { authGuard } from '@guards/auth-guard';
import { roleGuard } from '@guards/role-guard';
import { BackupComponent } from './backup.component';

/** Route configuration for the backup and restore page */
export const BACKUP_ROUTES: Route[] = [
  { path: 'backup', component: BackupComponent, canActivate: [authGuard, roleGuard] }
];
