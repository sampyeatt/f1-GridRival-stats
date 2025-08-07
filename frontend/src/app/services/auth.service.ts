import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
interface AuthResponse{
  token:string
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  apiUrl=`${environment.apiUrl}/api`;
  token: string|null = null;

  constructor(
    private http: HttpClient, private router: Router
  ) { }

  register(username: string, password: string){
    return this.http.post(`${this.apiUrl}/auth/register`, {username, password});
  }


  logout(){
    this.token=null;
    localStorage.removeItem('jwt');
    this.router.navigate(['/login']);
  }

  login(username: string, password: string){
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {username, password});
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
