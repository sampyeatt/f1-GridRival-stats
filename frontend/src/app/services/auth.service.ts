import {HttpClient} from '@angular/common/http'
import {inject, Injectable} from '@angular/core'
import {Router} from '@angular/router'
import {environment} from '../../environments/environment.development'
import {Session} from '../interface/api-interface'
import {share} from 'rxjs'
import {log} from 'node:util'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  apiUrl = `${environment.API_URL}/api/auth`

  private http = inject(HttpClient)
  public router = inject(Router)
  token?: string | null = null
  auth: boolean = false
  adminToken? : string | null = null

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

  saveAdminToken(token: string) {
    sessionStorage.setItem('adminToken', token)
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
      const adminToken = sessionStorage.getItem('adminToken')
      if (adminToken) return adminToken
      return this.adminToken = adminToken
    }
    return null
  }

  validateAdminToken(token: string){
    return this.http.post<{valid: boolean}>(`${this.apiUrl}/validateAdmin`, {token: token}).pipe(share())
    }

  validateUserToken(token: string){
    return this.http.post<{valid: boolean}>(`${this.apiUrl}/validateUser`, {token: token}).pipe(share())
    }

  isAuthenticated() {
    if (typeof window !== 'undefined') {
      const token = this.loadToken()
      if (!token) return false
      return this.validateUserToken(token).subscribe({
        next: (res) => {
          return res.valid
        },
        error: (err) => {
          console.error('Validation failed', err)
        }
      })
    }
    return false
  }

  isAdminAuthenticated() {
    if (typeof window !== 'undefined') {
      const token = this.loadAdminToken()
      if (!token) return false
      return this.validateAdminToken(token).subscribe({
        next: (res) => {
          return res.valid
        },
        error: (err) => {
          console.error('Admin validation failed', err)
        }
      })
    }
    return false
  }
}
