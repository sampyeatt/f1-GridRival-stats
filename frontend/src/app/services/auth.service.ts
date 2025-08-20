import {HttpClient} from '@angular/common/http'
import {inject, Injectable, signal} from '@angular/core'
import {Router} from '@angular/router'
import {environment} from '../../environments/environment'
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
  adminToken? : string | null = null
  currentUser = signal<Session | null> (null)

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

  isAuthenticated() {
    if (typeof window !== 'undefined') {
      const token = this.loadToken()
      if (!token || this.currentUser() === null) return false
      return (token === this.currentUser()?.accessToken)
    }
    return false
  }

  isAdminAuthenticated() {
    if (typeof window !== 'undefined') {
      const token = this.loadAdminToken()
      if (!token || this.currentUser() === null) return false
      return (token === this.currentUser()?.adminToken)
    }
    return false
  }
}
