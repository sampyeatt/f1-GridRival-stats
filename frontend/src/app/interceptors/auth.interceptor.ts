import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.loadToken();
  const adminToken = authService.loadAdminToken();
  if(token && !adminToken){
    const authReq = req.clone({
      setHeaders:{
        Authorization: `Bearer ${token}`
      }
    });
    return  next(authReq);
  } else if(token && adminToken){
    const authReq = req.clone({
      setHeaders:{
        Authorization: `Bearer ${token}`,
        AdminAuth: `Bearer ${adminToken}`
      }
    });
    return  next(authReq);
  }
  return next(req);
};
