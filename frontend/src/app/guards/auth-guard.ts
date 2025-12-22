import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth } from '@services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth)

  const token = auth.isAuthenticated()
  if(!token) {
    const router = inject(Router)
    router.navigate(['/'])
    return false
  }
  
  return true;
};
