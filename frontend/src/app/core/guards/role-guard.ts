/**
 * Role-based access route guard
 * Restricts access to admin-only routes by verifying the user's role via the API
 */

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth } from '@services/auth';

/**
 * CanActivate guard that fetches the user profile and checks for Admin role
 * Non-admin users are redirected to /dashboard.
 * Unauthenticated or errored requests redirect to /home.
 * 
 * @param route - The activated route snapshot
 * @param state - The router state snapshot
 * @returns true if user is Admin, false otherwise (triggers redirect)
 */
export const roleGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router)
  const authService = inject(Auth)

  try {
    const user = await authService.getProfile()
    
    if(user?.role === 'Admin') return true

    router.navigate(['/dashboard'])
    return false
  } catch (error) {
    router.navigate(['/home'])
    return false;
  }
};
