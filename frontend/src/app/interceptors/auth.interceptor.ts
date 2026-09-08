import {HttpErrorResponse, HttpInterceptorFn, HttpRequest} from '@angular/common/http'
import {inject} from '@angular/core'
import {catchError, switchMap, throwError} from 'rxjs'
import {AuthService} from '../services/auth.service'

/**
 * Attaches the bearer tokens, and retries once through a refresh on a 401.
 *
 * The previous version returned values RxJS cannot use — a bare `Error` from
 * `catchError`, and a `Subscription` from the refresh branch — so the retry it
 * appeared to implement never actually happened. It also kept its
 * "refreshing" flag in module scope, which under SSR is shared by every user
 * the process is serving; that state now lives on AuthService.
 */

/** Endpoints whose own 401 must not trigger a refresh attempt. */
function isAuthEndpoint(req: HttpRequest<unknown>): boolean {
    return /\/api\/auth\/(refresh|login|register)$/.test(req.url)
}

function withTokens(req: HttpRequest<unknown>, accessToken: string, adminToken: string | null) {
    const setHeaders: Record<string, string> = {Authorization: `Bearer ${accessToken}`}
    if (adminToken) setHeaders['AdminAuth'] = `Bearer ${adminToken}`
    return req.clone({setHeaders})
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService)
    const token = auth.loadToken()
    if (!token) return next(req)

    return next(withTokens(req, token, auth.loadAdminToken())).pipe(
        catchError((error: HttpErrorResponse) => {
            // Refreshing after a failed refresh would recurse until the stack
            // gave out; a failed login is not a session problem either.
            if (error.status !== 401 || isAuthEndpoint(req)) {
                return throwError(() => error)
            }

            return auth.refreshSession().pipe(
                switchMap(session => next(withTokens(req, session.accessToken, session.adminToken))),
                catchError(refreshError => {
                    // The refresh itself failed: the session is genuinely over.
                    auth.logout()
                    return throwError(() => refreshError)
                })
            )
        })
    )
}
