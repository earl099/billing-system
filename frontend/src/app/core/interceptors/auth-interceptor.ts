/**
 * HTTP authentication interceptor
 * Attaches JWT Bearer token to outgoing API requests and handles auth failures.
 * - Checks token expiration before each request and auto-logs out if expired
 * - Clones requests to add Authorization header
 * - Catches 401 responses and triggers logout
 */

import { isPlatformBrowser } from '@angular/common';
import type { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
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
  const platformId = inject(PLATFORM_ID)
  const isBrowser = isPlatformBrowser(platformId)
  const token = auth.token()

  // Check if token is expired and logout if necessary
  if(token && auth.isTokenExpired()) {
    if (isBrowser) {
      setTimeout(() => auth.logout(), 0)
    }
    return throwError(() => new Error('Token expired'))
  }

  // Attach Bearer token for cross-origin API auth (Render frontend/backend often on different origins)
  const authReq = token
    ? req.clone({ withCredentials: true, setHeaders: { Authorization: `Bearer ${token}` } })
    : req.clone({ withCredentials: true })

  return next(authReq).pipe(
    catchError(err => {
      // Auto-logout on 401 Unauthorized responses
      if(err.status === 401 && isBrowser) {
        auth.logout()
      }
      return throwError(() => err)
    })
  );
};
