import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';


export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  const authService = inject(AuthService)

  const isAuthenticated = authService.isAuthenticated()
  
  if(isAuthenticated) {
    return true;
  }

  router.navigateByUrl('/login')
  return false
  
};
