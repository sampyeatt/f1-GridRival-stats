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
  private router = inject(Router)
  token?: string | null = null


  register(email: string, password: string) {
    return this.http.post(`${this.apiUrl}/register`, {email: email, password})
  }

  logout() {
    this.token = null
    localStorage.removeItem('jwt')
    this.router.navigate(['/login'])
  }

  login(email: string, password: string) {
    return this.http.post<Session>(`${this.apiUrl}/login`, {email: email, password}).pipe(share())

  }

  saveToken(token: string) {
    this.token = token
    localStorage.setItem('jwt', token)
  }

  loadToken() {
    const token = localStorage.getItem('jwt')
    if (token) this.token = token
    return this.token
  }

  isAuthenticated() {
    return !!this.loadToken()
  }
}
