import { inject, signal } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth } from '@services/auth';

export const roleGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router)
  const authService = inject(Auth)

  try {
    const user = signal<any>({})
    user.set(await authService.getProfile())
    
    if(user().role === 'Admin') return true

    router.navigate(['/dashboard'])
    return false
  } catch (error) {
    router.navigate(['/home'])
    return false;
  }

};
