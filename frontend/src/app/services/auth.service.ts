import {HttpClient} from '@angular/common/http'
import {computed, inject, Injectable} from '@angular/core'
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
interface AuthResponse{
  token:string
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // apiUrl = `${environment.API_URL}/api/auth`

  apiUrl = computed(() => `${environment.API_URL}/api/auth`)

  private http = inject(HttpClient)
  private router = inject(Router)
  token: string|null = null;

  register(username: string, password: string){
    return this.http.post(`${this.apiUrl}/register`, {username, password});
  }


  logout(){
    this.token=null;
    localStorage.removeItem('jwt');
    this.router.navigate(['/login']);
  }

  login(username: string, password: string){

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {username, password}, {headers: {'Access-Control-Allow-Origin': environment.API_URL}});
  }

  saveToken(token: string){
    this.token = token;
    localStorage.setItem('jwt', token);
  }

  loadToken(){
    const token = localStorage.getItem('jwt');
    if(token) this.token = token;
    return this.token;
  }

  isAuthenticated(){
    return !!this.loadToken();
  }
}
