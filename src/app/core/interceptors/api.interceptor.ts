import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');

  let apiReq = req;

  if (!req.url.startsWith('http')) {
    apiReq = apiReq.clone({ url: `${environment.apiUrl}${req.url}` });
  }

  if (token) {
    apiReq = apiReq.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(apiReq);
};
