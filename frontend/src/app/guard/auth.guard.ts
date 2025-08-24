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
    if (auth.currentUser() !== null) {
      auth.refreshToken().subscribe({
        next: (res) => {
          auth.saveToken(res.accessToken)
          auth.saveUser(res)
          return true
        },
        error: (err) => {
          console.log(err)
        }
      })
    }
    router.navigate(['/login'])
    return false
  }
}

export const authGuardAdmin: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)
  const router = inject(Router)

  if (auth.isAdminAuthenticated()) {
    return true
  } else {
    if (auth.currentUser() !== null) {
      auth.refreshToken().subscribe({
        next: (res) => {
          auth.saveToken(res.accessToken)
          if (res.adminToken) auth.saveAdminToken(res.adminToken)
          auth.saveUser(res)
          return true
        },
        error: (err) => {
          console.log(err)
        }
      })
    }
    router.navigate(['/login'])
    return false
  }
}


