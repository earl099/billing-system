import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth } from '@services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth)

  const token = auth.hasValidToken()
  if(!token) {
    auth.logout()
    return false
  }

  return true;
};
