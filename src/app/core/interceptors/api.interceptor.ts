import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo agregar el baseUrl si la request no es a una URL absoluta
  if (!req.url.startsWith('http')) {
    const apiReq = req.clone({
      url: `${environment.apiUrl}${req.url}`
    });
    return next(apiReq);
  }

  return next(req);
};
