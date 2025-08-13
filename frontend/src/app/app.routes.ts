import { Routes } from '@angular/router';
import {DashboardComponent} from './pages/dashboard/dashboard'
import {LoginComponent} from './pages/login/login'
import {RegisterComponent} from './pages/register/register'
import {authGuard} from './auth.guard'

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', component: DashboardComponent},
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
