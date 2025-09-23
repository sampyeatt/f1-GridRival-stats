import {HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http'
import {inject} from '@angular/core'
import {AuthService} from '../services/auth.service'
import {BehaviorSubject, catchError, filter, switchMap, take, throwError} from 'rxjs'
let refreshing: boolean = false
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const token = authService.loadToken()
  if (token) {
    const authReq = addToken(req, token, authService)
    return next(authReq).pipe(
      // @ts-ignore
      catchError(error => {
        if (error.status === 401) {
          console.log('Test', error)
          return handle401Error(req, next, authService)
        } else {
          return new Error(error)
        }
      })
    )
  }
  return next(req)
}

const handle401Error = (req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) => {
  console.log('Refreshing token')
  if (!refreshing) {
    refreshing = true
    const user = authService.currentUser()
    if (!user) return new Error('User not found')
    return authService.refreshToken().subscribe({
      next: (res) => {
        refreshing = false
        authService.saveToken(res.accessToken)
        authService.saveUser(res)
        return next(addToken(req, res.accessToken, authService))
      },
      error: (err) => {
        refreshing = false
        authService.logout()
        return new Error(err)
      }
    })
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(accessToken => {
        return next(addToken(req, accessToken, authService));
      })
    );
  }
}

const addToken = (req: HttpRequest<any>, token: string, authService: AuthService) => {
  const adminToken = authService.loadAdminToken();
  if(!adminToken){
    return req.clone({
      setHeaders:{
        Authorization: `Bearer ${token}`
      }
    })
  } else {
    return req.clone({
      setHeaders:{
        Authorization: `Bearer ${token}`,
        AdminAuth: `Bearer ${adminToken}`
      }
    })
  }
}
