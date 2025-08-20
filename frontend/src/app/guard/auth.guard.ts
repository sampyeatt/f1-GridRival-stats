import {CanActivateFn, Router} from '@angular/router'
import {inject, Injectable} from '@angular/core'
import {AuthService} from '../services/auth.service'

Injectable({
  providedIn: 'root'
})

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)
  const router = inject(Router)

  if (auth.isAuthenticated()) {
    return true
  } else {
    router.navigate(['/login'])
    return false
  }
}

export const authGuardAdmin: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)
  const router = inject(Router)

  if (auth.isAdminAuthenticated()) {
    console.log('admin')
    return true
  } else {
    router.navigate(['/login'])
    return false
  }
}


