import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@services/auth';
import { catchError, finalize, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth)
  const token = auth.token()

  // Check if token is expired and logout if necessary
  if(token && auth.isTokenExpired()) {
    auth.logout()
    return throwError(() => new Error('Token expired'))
  }

  // Clone request with authorization header if token exists
  const authReq = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    : req

  return next(authReq).pipe(
    catchError(err => {
      if(err.status === 401) {
        auth.logout()
      }
      return throwError(() => err)
    })
  );
};
