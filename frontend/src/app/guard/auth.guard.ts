import {CanActivateFn, Router, UrlTree} from '@angular/router'
import {inject} from '@angular/core'
import {catchError, map, Observable, of} from 'rxjs'
import {AuthService} from '../services/auth.service'

/**
 * A CanActivateFn may return an Observable, which is what these want.
 *
 * The previous versions kicked off a refresh and then immediately redirected
 * and returned false — the `return true` sat inside a subscribe callback, where
 * it did nothing. Anyone whose access token had merely expired was bounced to
 * the login screen while the refresh quietly succeeded behind them.
 */

function refreshThen(
    auth: AuthService,
    router: Router,
    allow: () => boolean
): Observable<boolean | UrlTree> {
    const login = router.createUrlTree(['/login'])

    // Never signed in, or signed out: no refresh token to spend.
    if (auth.currentUser() == null) return of(login)

    return auth.refreshSession().pipe(
        map(() => (allow() ? true : login)),
        catchError(() => of(login))
    )
}

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService)
    const router = inject(Router)

    if (auth.isAuthenticated()) return true
    return refreshThen(auth, router, () => auth.isAuthenticated())
}

export const authGuardAdmin: CanActivateFn = () => {
    const auth = inject(AuthService)
    const router = inject(Router)

    if (auth.isAdminAuthenticated()) return true
    // A successful refresh only opens an admin route if the refreshed session
    // actually carries an admin token — an ordinary user refreshing is not a
    // route to the admin screens.
    return refreshThen(auth, router, () => auth.isAdminAuthenticated())
}
