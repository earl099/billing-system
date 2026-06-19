/**
 * HTTP authentication interceptor
 * Attaches JWT Bearer token to outgoing API requests and handles auth failures.
 * - Checks token expiration before each request and auto-logs out if expired
 * - Clones requests to add Authorization header
 * - Catches 401 responses and triggers logout
 */

import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@services/auth';
import { catchError, throwError } from 'rxjs';

/**
 * Functional HTTP interceptor that manages JWT authentication
 * Applied globally via app.config.ts HTTP_INTERCEPTORS provider
 * 
 * @param req - The outgoing HTTP request
 * @param next - The next interceptor or HTTP handler in the chain
 * @returns Observable of the HTTP response
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth)
  const token = auth.token()

  // Check if token is expired and logout if necessary
  if(token && auth.isTokenExpired()) {
    auth.logout()
    return throwError(() => new Error('Token expired'))
  }

  // Clone request with Authorization header if token exists
  const authReq = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    : req

  return next(authReq).pipe(
    catchError(err => {
      // Auto-logout on 401 Unauthorized responses
      if(err.status === 401) {
        auth.logout()
      }
      return throwError(() => err)
    })
  );
};
