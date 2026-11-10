/**
 * @fileoverview Angular application configuration
 * Defines the root ApplicationConfig with providers for routing, HTTP client
 * (with fetch API and JWT auth interceptor), zoneless change detection,
 * and global error listeners
 */

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@interceptors/auth-interceptor';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

/** Root application configuration with all providers */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZonelessChangeDetection(),
    provideClientHydration(withEventReplay())
  ]
};
