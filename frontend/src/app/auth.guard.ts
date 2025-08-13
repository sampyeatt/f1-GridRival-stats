import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('authGuard')
  if(auth.isAuthenticated()){
    return true;
  }else{
    router.navigate(['/login']);
    return true;
  }
};
