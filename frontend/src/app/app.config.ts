import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';

import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideToastr({
      positionClass: 'toast-bottom-right',
      preventDuplicates: true
    }),
    importProvidersFrom(MatNativeDateModule),
  ]
};
