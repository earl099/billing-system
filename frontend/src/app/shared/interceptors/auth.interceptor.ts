import type { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  let token = ''


  const authToken = 'Bearer ' + token
  const authReq = req.clone({
    setHeaders: {
      "Access-Control-Allow-Origin": "*",
      'Authorization': `${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  return next(authReq);
};
