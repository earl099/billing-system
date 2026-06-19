/**
 * Authentication route guard
 * Prevents access to protected routes when the user has no valid JWT token.
 * Redirects to login page if token is missing or expired.
 */

import { inject } from '@angular/core';
import { type CanActivateFn } from '@angular/router';
import { Auth } from '@services/auth';

/**
 * CanActivate guard that checks for a valid, non-expired JWT token
 * If the token is invalid, triggers logout (which clears storage and redirects)
 * 
 * @param route - The activated route snapshot
 * @param state - The router state snapshot
 * @returns true if token is valid, false otherwise (triggers logout redirect)
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth)

  const token = auth.hasValidToken()
  if(!token) {
    auth.logout()
    return false
  }

  return true;
};
