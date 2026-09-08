import {HttpClient} from '@angular/common/http'
import {inject, Injectable, signal} from '@angular/core'
import {Router} from '@angular/router'
import {catchError, finalize, Observable, shareReplay, tap, throwError} from 'rxjs'
import {environment} from '../../environments/environment'
import {Session} from '../interface/api-interface'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.API_URL}/api/auth`

  private http = inject(HttpClient)
  public router = inject(Router)

  token?: string | null = null
  adminToken?: string | null = null
  currentUser = signal<Session | null | undefined>(undefined)

  /**
   * The in-flight refresh, if any.
   *
   * Held on the service rather than in a module-level variable so that under
   * SSR — where one process serves every request — two users cannot end up
   * sharing a refresh. Concurrent 401s join this observable instead of each
   * firing their own refresh and invalidating one another's tokens.
   */
  private refresh$?: Observable<Session>

  register(email: string, password: string) {
    return this.http.post(`${this.apiUrl}/register`, {email, password})
  }

  login(email: string, password: string) {
    return this.http.post<Session>(`${this.apiUrl}/login`, {email, password}).pipe(
      tap(session => this.applySession(session))
    )
  }

  /**
   * Exchanges the refresh token for a new session.
   *
   * The body key is `refreshToken`: the previous version sent `{token}` while
   * the server's schema required `{refreshToken}`, so every refresh answered
   * 400 and sessions simply expired after an hour with no recovery.
   */
  refreshSession(): Observable<Session> {
    if (this.refresh$) return this.refresh$

    const refreshToken = this.currentUser()?.refreshToken
    if (!refreshToken) return throwError(() => new Error('No refresh token'))

    this.refresh$ = this.http.post<Session>(`${this.apiUrl}/refresh`, {refreshToken}).pipe(
      tap(session => this.applySession(session)),
      catchError(error => {
        this.clearSession()
        return throwError(() => error)
      }),
      finalize(() => {
        this.refresh$ = undefined
      }),
      shareReplay(1)
    )
    return this.refresh$
  }

  /** Stores a session everywhere it needs to live. */
  applySession(session: Session) {
    this.token = session.accessToken
    this.adminToken = session.adminToken
    this.currentUser.set(session)

    if (typeof window === 'undefined') return
    sessionStorage.setItem('jwt', session.accessToken)
    sessionStorage.setItem('user', JSON.stringify(session))
    if (session.adminToken) sessionStorage.setItem('adminToken', session.adminToken)
    else sessionStorage.removeItem('adminToken')
  }

  private clearSession() {
    this.token = null
    this.adminToken = null
    this.currentUser.set(null)

    if (typeof window === 'undefined') return
    for (const key of ['jwt', 'userId', 'user', 'adminToken']) {
      sessionStorage.removeItem(key)
    }
  }

  logout() {
    this.clearSession()
    this.router.navigate(['/login'])
  }

  /** Restores a session saved in a previous tab or page load. */
  restoreSession() {
    if (typeof window === 'undefined') return
    const stored = sessionStorage.getItem('user')
    if (!stored) {
      this.currentUser.set(null)
      return
    }
    try {
      const session = JSON.parse(stored) as Session
      this.token = session.accessToken
      this.adminToken = session.adminToken
      this.currentUser.set(session)
    } catch {
      // Corrupt storage should log the user out, not wedge the app on boot.
      this.clearSession()
    }
  }

  loadToken(): string | null {
    if (this.token) return this.token
    if (typeof window === 'undefined') return null
    this.token = sessionStorage.getItem('jwt')
    return this.token
  }

  loadAdminToken(): string | null {
    if (this.adminToken) return this.adminToken
    if (typeof window === 'undefined') return null
    this.adminToken = sessionStorage.getItem('adminToken')
    return this.adminToken
  }

  isAuthenticated(): boolean {
    return Boolean(this.loadToken()) && this.currentUser() != null
  }

  isAdminAuthenticated(): boolean {
    return this.isAuthenticated() && Boolean(this.loadAdminToken())
  }
}
