import {HttpClient} from '@angular/common/http'
import {inject, Injectable} from '@angular/core'
import {Router} from '@angular/router'
import {environment} from '../../environments/environment.development'
import {Session} from '../interface/api-interface'
import {share} from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  apiUrl = `${environment.API_URL}/api/auth`

  private http = inject(HttpClient)
  public router = inject(Router)
  token?: string | null = null
  auth: boolean = false

  register(email: string, password: string) {
    return this.http.post(`${this.apiUrl}/register`, {email: email, password})
  }

  logout() {
    if (typeof window !== 'undefined') {
      this.token = null
      sessionStorage.removeItem('jwt')
      sessionStorage.removeItem('userId')
      this.router.navigate(['/login'])
    }
  }

  login(email: string, password: string) {
    return this.http.post<Session>(`${this.apiUrl}/login`, {email: email, password}).pipe(share())

  }

  saveToken(token: string) {
    this.token = token
    sessionStorage.setItem('jwt', token)
  }

  saveUser(userId: number) {
    sessionStorage.setItem('userId', String(userId))
  }

  loadToken() {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('jwt')
      if (token) this.token = token
      return this.token
    }
    return null
  }

  loadAdminToken() {
    if (typeof window !== 'undefined')  {
      const userId = sessionStorage.getItem('userId')
      const role = this.http.get<string>(`${this.apiUrl}/role/${userId}`).pipe(share())
      role.subscribe({
        next: (role) => {
          if (role) return (role === 'admin')
          else return false
        },
        error: (err) => {
          console.error('Error loading role:', err)
          return false
        }
      })
    }
  }

  isAuthenticated() {
    if (typeof window !== 'undefined')  return !!this.loadToken()
    return false
  }

  isAdminAuthenticated() {
    return this.loadAdminToken()
  }
}
