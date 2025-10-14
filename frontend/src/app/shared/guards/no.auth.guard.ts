import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '@services/auth.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  const authService = inject(AuthService)

  const isAuthenticated = authService.isAuthenticated()

  if(!isAuthenticated) {
    return true;
  }

  router.navigateByUrl('/')
  return false
};
